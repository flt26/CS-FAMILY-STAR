-- Lock the database down so every write has to go through the app.
--
-- ⚠️  Order matters:
--   1. Add SUPABASE_SERVICE_ROLE_KEY to the deployment's environment
--      (Vercel → Project → Settings → Environment Variables) and redeploy.
--   2. Only then run this file in the Supabase SQL editor.
-- Running it first makes every new review fail, because the app would still be
-- writing with the publishable (anon) key that this file takes write access from.
--
-- Safe to run again: every step replaces what an earlier run created.

-- 1) Constraints. NOT VALID leaves rows written before validation existed alone.
alter table public.reviews drop constraint if exists reviews_restaurant_id_format;
alter table public.reviews drop constraint if exists reviews_rating_range;
alter table public.reviews drop constraint if exists reviews_comment_length;
alter table public.reviews drop constraint if exists reviews_user_name_length;
alter table public.reviews drop constraint if exists reviews_image_url_own_bucket;
alter table public.reviews
  add constraint reviews_restaurant_id_format check (restaurant_id ~ '^[a-z0-9-]{1,64}$') not valid,
  add constraint reviews_rating_range check (rating between 1 and 5) not valid,
  add constraint reviews_comment_length check (char_length(comment) <= 500) not valid,
  add constraint reviews_user_name_length check (char_length(user_name) between 1 and 32) not valid,
  add constraint reviews_image_url_own_bucket check (
    image_url is null
    or (
      image_url ~ '^https?://[^/?#]+/storage/v1/object/public/review-images/[A-Za-z0-9/_.-]+$'
      and image_url !~ '/\.\.?/'
    )
  ) not valid;

-- 2) Row Level Security: anyone may read, nobody may write with the public key.
--    The service role bypasses RLS, so the app keeps working.
alter table public.reviews enable row level security;

-- Drop every policy on reviews that isn't a plain read, whatever its name
-- (policies made in the dashboard are called things like "Enable insert for all users").
do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'reviews' and cmd <> 'SELECT'
  loop
    raise notice 'Dropping policy % on public.reviews', p.policyname;
    execute format('drop policy %I on public.reviews', p.policyname);
  end loop;
end $$;

drop policy if exists "Reviews are readable by everyone" on public.reviews;
create policy "Reviews are readable by everyone"
  on public.reviews for select
  to anon, authenticated
  using (true);

-- 3) Storage: photos stay public to read; size and type are capped at the bucket.
update storage.buckets
set public = true,
    file_size_limit = 3145728,  -- 3 MB, same as the app
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'review-images';

-- The app uploads with the service role, so no policy may let anyone else
-- write to the bucket. Drop every write policy on storage.objects that names
-- review-images, or that names no bucket at all (it would cover this one too).
do $$
declare
  p record;
begin
  for p in
    select policyname, coalesce(qual, '') || ' ' || coalesce(with_check, '') as rule
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and cmd <> 'SELECT'
  loop
    if p.rule like '%review-images%' or p.rule not like '%bucket_id%' then
      raise notice 'Dropping policy % on storage.objects', p.policyname;
      execute format('drop policy %I on storage.objects', p.policyname);
    end if;
  end loop;
end $$;
