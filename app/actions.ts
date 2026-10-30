'use server';

import { updateTag } from 'next/cache';
import { headers } from 'next/headers';
import sharp from 'sharp';
import { USING_DEFAULT_PROJECT } from '@/lib/config';
import { clientAddress, reserveReview } from '@/lib/rate-limit';
import { LIMITS, parseReviewForm, sniffImage, type FieldErrors, type ReviewInput } from '@/lib/review-input';
import { REVIEW_IMAGES_BUCKET, supabase } from '@/lib/supabase';

export type ReviewState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fields?: FieldErrors }
  | { status: 'done'; spotId: string; rating: number; at: string; first: boolean };

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

export async function submitReview(_previous: ReviewState, form: FormData): Promise<ReviewState> {
  // Only the deployed site writes to the live project. A local build with no
  // .env.local (dev or `next start`) would otherwise post test reviews to it.
  if (USING_DEFAULT_PROJECT && !process.env.VERCEL) {
    return {
      status: 'error',
      message: 'This copy is read-only against the live project. Set NEXT_PUBLIC_SUPABASE_URL in .env.local to post.',
    };
  }

  const parsed = parseReviewForm(form);
  if (!parsed.ok) {
    return { status: 'error', message: 'Check the highlighted fields.', fields: parsed.errors };
  }
  const { spotId, rating, name } = parsed.value;

  // People never see this field; bots fill in everything. Pretend it worked.
  if (String(form.get('website') ?? '') !== '') {
    return { status: 'done', spotId, rating, at: new Date().toISOString(), first: false };
  }

  const slot = reserveReview(clientAddress(await headers()), name);
  if (!slot.ok) {
    return {
      status: 'error',
      message:
        slot.wait === 'seconds'
          ? 'One review at a time. Try again in a few seconds; nothing was posted.'
          : 'Lots of reviews from this connection just now. Try again in a few minutes; nothing was posted.',
    };
  }

  // A verdict that didn't save hands its slot back, so retrying isn't punished.
  try {
    const result = await postReview(parsed.value, form.get('photo'));
    if (result.status !== 'done') slot.release();
    return result;
  } catch (error) {
    slot.release();
    throw error;
  }
}

async function postReview(
  { spotId, rating, name, comment }: ReviewInput,
  photo: FormDataEntryValue | null,
): Promise<ReviewState> {
  const db = supabase();

  // Catches double taps and copy-paste spam: the very same verdict again. Two
  // students who happen to shuffle the same nickname still both get through.
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
  const { count } = await db
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', spotId)
    .eq('user_name', name)
    .eq('rating', rating)
    .eq('comment', comment)
    .gte('created_at', since);
  if (count) {
    return { status: 'error', message: 'You just posted this exact review. It’s already on the ticket.' };
  }

  // Whether this verdict is the spot's first, for the "root commit" receipt.
  // Counted the way the scoreboard counts: ratings outside 1–5 don't exist.
  const { count: earlier } = await db
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', spotId)
    .gte('rating', 1)
    .lte('rating', 5);

  let imageUrl: string | null = null;
  let imagePath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > LIMITS.photoBytes) {
      return { status: 'error', message: 'That photo is too big.', fields: { photo: 'Photos can be up to 3 MB.' } };
    }
    const image = await reencode(new Uint8Array(await photo.arrayBuffer()));
    if (!image) {
      return { status: 'error', message: 'We could not read that photo.', fields: { photo: 'Use a JPG, PNG or WebP.' } };
    }
    imagePath = `reviews/${spotId}/${crypto.randomUUID()}.webp`;
    const { error } = await db.storage
      .from(REVIEW_IMAGES_BUCKET)
      .upload(imagePath, image, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
    if (error) {
      console.error('Photo upload failed:', error);
      return {
        status: 'error',
        message: 'The photo didn’t upload. Try again, or post without it.',
        fields: { photo: 'The photo didn’t upload. Tap Remove photo to post without it, or try again.' },
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
    return { status: 'error', message: 'Your review didn’t save, so nothing was posted. Try again in a moment.' };
  }

  updateTag('reviews');
  updateTag(`reviews:${spotId}`);
  return { status: 'done', spotId, rating, at: new Date().toISOString(), first: earlier === 0 };
}

/**
 * Decodes the photo and writes a fresh WebP. Anything that only looks like an
 * image fails here, the EXIF block (GPS included) is dropped, and the long
 * edge is capped at 1600px whatever the browser did.
 */
async function reencode(bytes: Uint8Array): Promise<Buffer | null> {
  if (!sniffImage(bytes)) return null;
  try {
    return await sharp(bytes, { limitInputPixels: 50_000_000 })
      .autoOrient()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return null;
  }
}
