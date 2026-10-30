// Public Supabase project values. The publishable key ships to every browser
// that talks to the project by design; Row Level Security guards the data.
// They stay as defaults so a deploy without env vars keeps working.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ufzroumxehomggrxsoin.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p5XoEKQBWvIQ-OH0Zg7Ymw_Ed02JCok';

export const REVIEW_IMAGES_BUCKET = 'review-images';

/** True when nobody pointed the app at a project, i.e. it is using the live one. */
export const USING_DEFAULT_PROJECT = !process.env.NEXT_PUBLIC_SUPABASE_URL;
