'use server';

import { updateTag } from 'next/cache';
import { headers } from 'next/headers';
import { USING_DEFAULT_PROJECT } from '@/lib/config';
import { allowReview } from '@/lib/rate-limit';
import { LIMITS, parseReviewForm, sniffImage, type FieldErrors } from '@/lib/review-input';
import { REVIEW_IMAGES_BUCKET, supabase } from '@/lib/supabase';

export type ReviewState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fields?: FieldErrors }
  | { status: 'done'; spotId: string; rating: number; at: string; first: boolean };

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

export async function submitReview(_previous: ReviewState, form: FormData): Promise<ReviewState> {
  // A dev server with no .env reads the live project; keep test reviews out of it.
  if (process.env.NODE_ENV !== 'production' && USING_DEFAULT_PROJECT) {
    return {
      status: 'error',
      message: 'Local dev is read-only against the live project. Set NEXT_PUBLIC_SUPABASE_URL in .env.local to post.',
    };
  }

  const parsed = parseReviewForm(form);
  if (!parsed.ok) {
    return { status: 'error', message: 'Check the highlighted fields.', fields: parsed.errors };
  }
  const { spotId, rating, name, comment } = parsed.value;

  // People never see this field; bots fill in everything. Pretend it worked.
  if (String(form.get('website') ?? '') !== '') {
    return { status: 'done', spotId, rating, at: new Date().toISOString(), first: false };
  }

  const requestHeaders = await headers();
  const ip =
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || 'unknown';
  if (!allowReview(ip)) {
    return { status: 'error', message: 'Too many verdicts in a row. Try again in a few minutes.' };
  }

  const db = supabase();

  // Catches double taps and copy-paste spam under the same nickname.
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
  const { count } = await db
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', spotId)
    .eq('user_name', name)
    .gte('created_at', since);
  if (count) {
    return { status: 'error', message: 'You just rated this spot. Give it a few minutes before rating it again.' };
  }

  // Whether this verdict is the spot's first, for the "root commit" receipt.
  const { count: earlier } = await db
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', spotId);

  let imageUrl: string | null = null;
  let imagePath: string | null = null;
  const photo = form.get('photo');
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > LIMITS.photoBytes) {
      return { status: 'error', message: 'That photo is too big.', fields: { photo: 'Photos can be up to 3 MB.' } };
    }
    const bytes = new Uint8Array(await photo.arrayBuffer());
    const kind = sniffImage(bytes);
    if (!kind) {
      return { status: 'error', message: 'We could not read that photo.', fields: { photo: 'Use a JPG, PNG or WebP.' } };
    }
    imagePath = `reviews/${spotId}/${crypto.randomUUID()}.${kind.ext}`;
    const { error } = await db.storage
      .from(REVIEW_IMAGES_BUCKET)
      .upload(imagePath, bytes, { contentType: kind.mime, cacheControl: '31536000', upsert: false });
    if (error) {
      console.error('Photo upload failed:', error);
      return {
        status: 'error',
        message: 'The photo did not upload. Try again, or post without it.',
        fields: { photo: 'Upload failed.' },
      };
    }
    imageUrl = db.storage.from(REVIEW_IMAGES_BUCKET).getPublicUrl(imagePath).data.publicUrl;
  }

  const { error } = await db
    .from('reviews')
    .insert({ restaurant_id: spotId, rating, comment, user_name: name, image_url: imageUrl });
  if (error) {
    console.error('Review insert failed:', error);
    if (imagePath) await db.storage.from(REVIEW_IMAGES_BUCKET).remove([imagePath]);
    return { status: 'error', message: 'Your verdict did not save. Try again in a moment.' };
  }

  updateTag('reviews');
  updateTag(`reviews:${spotId}`);
  return { status: 'done', spotId, rating, at: new Date().toISOString(), first: earlier === 0 };
}
