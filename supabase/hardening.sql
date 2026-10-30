-- Lock the database down so every write has to go through the app.
--
-- ⚠️  Order matters:
--   1. Add SUPABASE_SERVICE_ROLE_KEY to the deployment's environment
--      (Vercel → Project → Settings → Environment Variables) and redeploy.
--   2. Only then run this file in the Supabase SQL editor.
-- Running it first makes every new review fail, because the app would still be
-- writing with the publishable (anon) key that this file takes write access from.

-- 1) Constraints. NOT VALID leaves rows written before validation existed alone.
alter table public.reviews
  add constraint reviews_rating_range check (rating between 1 and 5) not valid,
  add constraint reviews_comment_length check (char_length(comment) <= 500) not valid,
  add constraint reviews_user_name_length check (char_length(user_name) between 1 and 32) not valid,
  add constraint reviews_image_url_own_bucket check (
    image_url is null or image_url like '%/storage/v1/object/public/review-images/%'
  ) not valid;

-- 2) Row Level Security: anyone may read, nobody may write with the public key.
--    The service role bypasses RLS, so the app keeps working.
alter table public.reviews enable row level security;

-- Policies created from the dashboard have arbitrary names. List them first:
--   select policyname, cmd, roles from pg_policies where tablename = 'reviews';
-- then drop every INSERT / UPDATE / DELETE policy that applies to anon or authenticated:
--   drop policy "<name>" on public.reviews;

drop policy if exists "Reviews are readable by everyone" on public.reviews;
create policy "Reviews are readable by everyone"
  on public.reviews for select
  to anon, authenticated
  using (true);

-- 3) Storage: keep photos public to read, cap size and type at the bucket level.
update storage.buckets
set public = true,
    file_size_limit = 3145728,  -- 3 MB, same as the app
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'review-images';

-- Uploads from the browser are no longer needed. List the storage policies:
--   select policyname, cmd, roles from pg_policies
--   where schemaname = 'storage' and tablename = 'objects';
-- and drop any INSERT / UPDATE / DELETE policy that lets anon touch 'review-images':
--   drop policy "<name>" on storage.objects;
