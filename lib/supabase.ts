import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { REVIEW_IMAGES_BUCKET, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

export { REVIEW_IMAGES_BUCKET };

let client: SupabaseClient | undefined;

/**
 * Server-only client. With SUPABASE_SERVICE_ROLE_KEY set, every write passes
 * through this app's validation and the database can refuse anonymous writes
 * outright (see supabase/hardening.sql). Without it the publishable key is
 * used, which works only while anonymous inserts are still allowed.
 */
export function supabase(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

const OWN_IMAGES = new URL(`/storage/v1/object/public/${REVIEW_IMAGES_BUCKET}/`, SUPABASE_URL);

/**
 * The normalised URL when `url` points at an object in our own review-images
 * bucket, otherwise null. Parsing resolves "../" tricks before the check.
 */
export function ownImageUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    return parsed.origin === OWN_IMAGES.origin &&
      parsed.pathname.startsWith(OWN_IMAGES.pathname) &&
      parsed.pathname.length > OWN_IMAGES.pathname.length &&
      !parsed.search &&
      !parsed.hash
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}
