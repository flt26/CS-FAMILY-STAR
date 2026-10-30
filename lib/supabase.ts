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

/** True for public URLs of objects in our own review-images bucket. */
export function isOwnImageUrl(url: unknown): url is string {
  return (
    typeof url === 'string' &&
    url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/${REVIEW_IMAGES_BUCKET}/`)
  );
}
