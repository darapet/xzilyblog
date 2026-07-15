-- Xzily Blog — Supabase schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query),
-- on a fresh project, BEFORE running seed.sql.

create extension if not exists pgcrypto;

-- =========================================================
-- profiles — one row per registered reader/admin, auto-created on signup
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone" on public.profiles
  for select using (true);
create policy "users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Helper used by RLS policies below. security definer + fixed search_path
-- avoids recursive-RLS issues when policies need to check admin status.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Guard rails so a regular user can never grant themselves admin access,
-- even if they call the API directly instead of going through the app UI.
create or replace function public.force_profile_is_admin_false()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.is_admin := false;
  return new;
end;
$$;
drop trigger if exists profiles_force_insert_not_admin on public.profiles;
create trigger profiles_force_insert_not_admin
  before insert on public.profiles
  for each row execute procedure public.force_profile_is_admin_false();

create or replace function public.prevent_is_admin_selfescalate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_guard_is_admin on public.profiles;
create trigger profiles_guard_is_admin
  before update on public.profiles
  for each row execute procedure public.prevent_is_admin_selfescalate();

-- =========================================================
-- posts
-- =========================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  cover_image text not null default 'images/cover-1.jpg',
  author_id text not null default 'u1',
  category_id text not null,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  reading_time int not null default 1,
  views int not null default 0,
  likes int not null default 0,
  featured boolean not null default false,
  popular boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.posts enable row level security;

create policy "published posts are viewable by everyone" on public.posts
  for select using (status = 'published' or public.is_admin());
create policy "admins can insert posts" on public.posts
  for insert with check (public.is_admin());
create policy "admins can update posts" on public.posts
  for update using (public.is_admin());
create policy "admins can delete posts" on public.posts
  for delete using (public.is_admin());

-- Lets anonymous readers bump a post's view count without granting them
-- general update rights on the posts table.
create or replace function public.increment_post_views(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts set views = views + 1 where id = p_id;
$$;

-- =========================================================
-- comments (one level of replies via parent_id)
-- =========================================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'Guest Reader',
  content text not null,
  likes int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;

create policy "comments are viewable by everyone" on public.comments
  for select using (true);
create policy "signed-in users can comment" on public.comments
  for insert with check (auth.uid() = author_id);
create policy "owners or admins can delete comments" on public.comments
  for delete using (auth.uid() = author_id or public.is_admin());

-- =========================================================
-- per-user likes / bookmarks
-- =========================================================
create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_likes enable row level security;
create policy "likes are viewable by everyone" on public.post_likes for select using (true);
create policy "users manage own likes" on public.post_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.bookmarks (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.bookmarks enable row level security;
create policy "users manage own bookmarks" on public.bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
alter table public.comment_likes enable row level security;
create policy "comment likes are viewable by everyone" on public.comment_likes for select using (true);
create policy "users manage own comment likes" on public.comment_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Keep the denormalized like counters on posts/comments in sync.
create or replace function public.bump_post_likes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes = likes + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set likes = greatest(0, likes - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;
drop trigger if exists post_likes_bump on public.post_likes;
create trigger post_likes_bump
  after insert or delete on public.post_likes
  for each row execute procedure public.bump_post_likes();

create or replace function public.bump_comment_likes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set likes = likes + 1 where id = new.comment_id;
  elsif tg_op = 'DELETE' then
    update public.comments set likes = greatest(0, likes - 1) where id = old.comment_id;
  end if;
  return null;
end;
$$;
drop trigger if exists comment_likes_bump on public.comment_likes;
create trigger comment_likes_bump
  after insert or delete on public.comment_likes
  for each row execute procedure public.bump_comment_likes();

-- =========================================================
-- newsletter subscribers & contact messages
-- =========================================================
create table if not exists public.subscribers (
  email text primary key,
  subscribed_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
create policy "anyone can subscribe" on public.subscribers for insert with check (true);
create policy "admins can view subscribers" on public.subscribers for select using (public.is_admin());
create policy "admins can remove subscribers" on public.subscribers for delete using (public.is_admin());

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.contacts enable row level security;
create policy "anyone can send a contact message" on public.contacts for insert with check (true);
create policy "admins can view contact messages" on public.contacts for select using (public.is_admin());
