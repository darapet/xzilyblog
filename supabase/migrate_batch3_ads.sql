-- Batch 3: Advertisements
-- Run once in Supabase Dashboard → SQL Editor → New query

-- ── 1. ads table ─────────────────────────────────────────────────────────────
create table if not exists public.ads (
  id             uuid primary key default gen_random_uuid(),
  title          text not null default '',
  body           text not null default '',
  image_url      text not null default '',
  video_url      text not null default '',
  link_url       text not null default '',
  position       text not null default 'both'
                   check (position in ('sidebar','between-posts','both')),
  is_active      boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists ads_active_idx on public.ads(is_active);
create index if not exists ads_order_idx  on public.ads(sort_order);

alter table public.ads enable row level security;

-- Admins can do everything
drop policy if exists "admins manage ads" on public.ads;
create policy "admins manage ads" on public.ads
  using (public.is_admin())
  with check (public.is_admin());

-- Public can read active ads
drop policy if exists "public read active ads" on public.ads;
create policy "public read active ads" on public.ads
  for select using (is_active = true);

-- ── 2. Supabase Storage bucket for ad videos (if not exists) ─────────────────
-- Create manually in Dashboard → Storage if you want Supabase video hosting.
-- Cloudinary is used for images; videos can go to Supabase Storage bucket "ad-videos".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ad-videos', 'ad-videos', true,
  52428800,  -- 50 MB
  array['video/mp4','video/webm','video/ogg','video/quicktime']
)
on conflict (id) do nothing;

-- Allow public to read video files
drop policy if exists "public read ad videos" on storage.objects;
create policy "public read ad videos" on storage.objects
  for select using (bucket_id = 'ad-videos');

-- Allow admins to upload/delete video files
drop policy if exists "admins manage ad videos" on storage.objects;
create policy "admins manage ad videos" on storage.objects
  using (bucket_id = 'ad-videos' and public.is_admin())
  with check (bucket_id = 'ad-videos' and public.is_admin());
