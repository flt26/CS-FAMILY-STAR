'use server';

import { updateTag } from 'next/cache';
import { headers } from 'next/headers';
import sharp from 'sharp';
import { USING_DEFAULT_PROJECT } from '@/lib/config';
import { claimReview, clientAddress, reserveReview } from '@/lib/rate-limit';
import { LIMITS, parseReviewForm, sniffImage, type FieldErrors, type ReviewInput } from '@/lib/review-input';
import { REVIEW_IMAGES_BUCKET, supabase } from '@/lib/supabase';

export type ReviewState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fields?: FieldErrors }
  | { status: 'done'; spotId: string; rating: number; at: string; first: boolean };

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

  const address = clientAddress(await headers());
  const slot = reserveReview(address, name);
  if (!slot.ok) {
    return {
      status: 'error',
      message:
        slot.wait === 'seconds'
          ? 'One review at a time. Try again in a few seconds; nothing was posted.'
          : 'Lots of reviews from this connection just now. Try again in a few minutes; nothing was posted.',
    };
  }

  // From here on a mistake on the client's side (the same review again, a
  // photo we can't use) keeps its slot, so it can't make the server work for
  // free. Only our own failures hand the slot back.
  const repeat = claimReview(address, parsed.value);
  if (!repeat.ok) {
    return { status: 'error', message: 'You just posted this exact review. It’s already on the ticket.' };
  }

  try {
    const photo = await readPhoto(form.get('photo'));
    if (!photo.ok) {
      repeat.release();
      return photo.error;
    }
    const result = await saveReview(parsed.value, photo.image);
    if (result.status !== 'done') {
      repeat.release();
      slot.release();
    }
    return result;
  } catch (error) {
    repeat.release();
    slot.release();
    throw error;
  }
}

/** The photo, re-encoded, or the reason it can't be used. No photo is fine. */
async function readPhoto(
  photo: FormDataEntryValue | null,
): Promise<{ ok: true; image: Buffer | null } | { ok: false; error: ReviewState }> {
  if (!(photo instanceof File) || photo.size === 0) return { ok: true, image: null };
  if (photo.size > LIMITS.photoBytes) {
    return {
      ok: false,
      error: { status: 'error', message: 'That photo is too big.', fields: { photo: 'Photos can be up to 3 MB.' } },
    };
  }
  const image = await reencode(new Uint8Array(await photo.arrayBuffer()));
  if (!image) {
    return {
      ok: false,
      error: { status: 'error', message: 'We could not read that photo.', fields: { photo: 'Use a JPG, PNG or WebP.' } },
    };
  }
  return { ok: true, image };
}

/** Stores the photo and the review. Any failure here is on our side. */
async function saveReview(
  { spotId, rating, name, comment }: ReviewInput,
  image: Buffer | null,
): Promise<ReviewState> {
  const db = supabase();

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
  if (image) {
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
    // The browser already shrank it to 1600px; 4096² still fits a phone's
    // original photo and keeps a decompression bomb cheap to refuse.
    return await sharp(bytes, { limitInputPixels: 4096 * 4096 })
      .autoOrient()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return null;
  }
}
