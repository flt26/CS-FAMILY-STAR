import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { isOwnImageUrl, supabase } from './supabase';

export interface Review {
  id: number;
  spotId: string;
  rating: number;
  comment: string;
  name: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface SpotStats {
  count: number;
  /** Plain mean, one decimal — what students see. */
  average: number;
  sum: number;
  /** Count of 1★ … 5★ verdicts. */
  histogram: [number, number, number, number, number];
  firstAt: string | null;
  lastAt: string | null;
}

export interface Scoreboard {
  /** False when Supabase could not be reached; stats are then empty. */
  ok: boolean;
  stats: Record<string, SpotStats>;
  total: number;
  /** Mean of every verdict, used as the prior when ranking. */
  mean: number;
}

const REVIEW_COLUMNS = 'id, restaurant_id, rating, comment, user_name, image_url, created_at';

const reason = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);
const PAGE_SIZE = 1000;

/** Ratings written before validation existed can be anything; keep 1–5 only. */
function validRating(value: unknown): number | null {
  const rating = Number(value);
  return Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

function toReview(row: Record<string, unknown>): Review | null {
  const rating = validRating(row.rating);
  if (rating === null || typeof row.restaurant_id !== 'string') return null;
  const name = typeof row.user_name === 'string' ? row.user_name.trim() : '';
  return {
    id: Number(row.id),
    spotId: row.restaurant_id,
    rating: Math.round(rating),
    comment: typeof row.comment === 'string' ? row.comment.trim() : '',
    name: name || 'Anonymous',
    imageUrl: isOwnImageUrl(row.image_url) ? row.image_url : null,
    createdAt: String(row.created_at),
  };
}

/**
 * Per-spot stats from every review. PostgREST caps a response at 1000 rows,
 * so the table is read page by page instead of trusting a single select.
 */
export async function getScoreboard(): Promise<Scoreboard> {
  'use cache';
  cacheTag('reviews');

  try {
    const rows: { restaurant_id: string; rating: unknown; created_at: string }[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase()
        .from('reviews')
        .select('restaurant_id, rating, created_at')
        .order('id')
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      rows.push(...data);
      if (data.length < PAGE_SIZE) break;
    }

    const stats: Record<string, SpotStats> = {};
    let total = 0;
    let sum = 0;
    for (const row of rows) {
      const rating = validRating(row.rating);
      if (rating === null) continue;
      const entry = (stats[row.restaurant_id] ??= {
        count: 0,
        average: 0,
        sum: 0,
        histogram: [0, 0, 0, 0, 0],
        firstAt: null,
        lastAt: null,
      });
      entry.count += 1;
      entry.sum += rating;
      entry.histogram[Math.round(rating) - 1] += 1;
      if (!entry.firstAt || row.created_at < entry.firstAt) entry.firstAt = row.created_at;
      if (!entry.lastAt || row.created_at > entry.lastAt) entry.lastAt = row.created_at;
      total += 1;
      sum += rating;
    }
    for (const entry of Object.values(stats)) {
      entry.average = Math.round((entry.sum / entry.count) * 10) / 10;
    }

    cacheLife('minutes');
    return { ok: true, stats, total, mean: total ? sum / total : 0 };
  } catch (error) {
    console.error('Could not load review stats:', reason(error));
    // Keep an outage out of the cache so the next request retries.
    cacheLife('seconds');
    return { ok: false, stats: {}, total: 0, mean: 0 };
  }
}

export async function getSpotReviews(spotId: string): Promise<{ ok: boolean; reviews: Review[] }> {
  'use cache';
  cacheTag('reviews', `reviews:${spotId}`);

  try {
    const { data, error } = await supabase()
      .from('reviews')
      .select(REVIEW_COLUMNS)
      .eq('restaurant_id', spotId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    cacheLife('minutes');
    return { ok: true, reviews: data.map(toReview).filter((review) => review !== null) };
  } catch (error) {
    console.error(`Could not load reviews for ${spotId}:`, reason(error));
    cacheLife('seconds');
    return { ok: false, reviews: [] };
  }
}

/** Latest verdict that says something from each recently reviewed spot, for the live feed. */
export async function getRecentReviews(limit = 8): Promise<Review[]> {
  'use cache';
  cacheTag('reviews');

  try {
    const { data, error } = await supabase()
      .from('reviews')
      .select(REVIEW_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(limit * 6);
    if (error) throw error;
    cacheLife('minutes');
    // One slip per spot, so a busy hour at one counter doesn't fill the whole feed.
    const seen = new Set<string>();
    const recent: Review[] = [];
    for (const review of data.map(toReview)) {
      if (!review || !review.comment || seen.has(review.spotId)) continue;
      seen.add(review.spotId);
      recent.push(review);
      if (recent.length === limit) break;
    }
    return recent;
  } catch (error) {
    console.error('Could not load recent reviews:', reason(error));
    cacheLife('seconds');
    return [];
  }
}
