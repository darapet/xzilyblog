-- Batch 1: Writer accounts
-- Run once in Supabase Dashboard → SQL Editor → New query
-- Safe on an existing database (uses IF NOT EXISTS / ON CONFLICT patterns)

-- ── 1. Extend profiles ───────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists first_name  text not null default '',
  add column if not exists middle_name text not null default '',
  add column if not exists last_name   text not null default '',
  add column if not exists phone       text not null default '',
  add column if not exists address     text not null default '',
  add column if not exists role        text not null default 'reader',
  add column if not exists status      text not null default 'active';

alter table public.profiles
  drop constraint if exists profiles_role_check,
  add constraint profiles_role_check   check (role   in ('reader','writer','admin')),
  drop constraint if exists profiles_status_check,
  add constraint profiles_status_check check (status in ('active','suspended','restricted'));

-- ── 2. Link authors table to auth users ──────────────────────────────────────
alter table public.authors
  add column if not exists profile_id uuid references auth.users(id) on delete set null;

-- Unique so ON CONFLICT works (nulls are allowed multiple times in PG)
create unique index if not exists authors_profile_id_unique
  on public.authors (profile_id) where profile_id is not null;

-- ── 3. Trigger: prevent direct role / status self-escalation ─────────────────
create or replace function public.prevent_role_status_selfchange()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Internal RPCs (security definer) set this flag to bypass the guard
  if current_setting('xzily.internal_call', true) = 'true' then
    return new;
  end if;
  if not public.is_admin() then
    new.role   := old.role;
    new.status := old.status;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_prevent_role_status_selfchange on public.profiles;
create trigger profiles_prevent_role_status_selfchange
  before update on public.profiles
  for each row execute procedure public.prevent_role_status_selfchange();

-- ── 4. RPC: complete writer registration (security definer) ──────────────────
create or replace function public.register_writer(
  p_first_name  text,
  p_middle_name text,
  p_last_name   text,
  p_author_name text,
  p_phone       text,
  p_address     text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid       uuid  := auth.uid();
  v_email     text;
  v_author_id uuid;
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  select email into v_email from public.profiles where id = v_uid;

  -- Bypass the role/status change guard for this call
  perform set_config('xzily.internal_call', 'true', true);

  update public.profiles set
    first_name  = p_first_name,
    middle_name = p_middle_name,
    last_name   = p_last_name,
    phone       = p_phone,
    address     = p_address,
    name        = trim(p_first_name || ' ' || p_last_name),
    role        = 'writer',
    status      = 'active'
  where id = v_uid;

  -- Create the author (team) record so posts can link to it
  insert into public.authors (name, email, role, profile_id)
  values (
    coalesce(nullif(trim(p_author_name), ''), trim(p_first_name || ' ' || p_last_name)),
    v_email,
    'Writer',
    v_uid
  )
  on conflict (profile_id) do update set
    name  = excluded.name,
    email = excluded.email
  returning id into v_author_id;

  if v_author_id is null then
    select id into v_author_id from public.authors where profile_id = v_uid;
  end if;

  return v_author_id;
end;
$$;

-- ── 5. Posts RLS — writers manage their own posts ────────────────────────────
drop policy if exists "writers can insert own posts"   on public.posts;
drop policy if exists "writers can update own posts"   on public.posts;
drop policy if exists "writers can delete own posts"   on public.posts;

create policy "writers can insert own posts" on public.posts
  for insert with check (
    (select role   from public.profiles where id = auth.uid()) = 'writer'
    and (select status from public.profiles where id = auth.uid()) = 'active'
    and author_id in (
      select id::text from public.authors where profile_id = auth.uid()
    )
  );

create policy "writers can update own posts" on public.posts
  for update using (
    (select role   from public.profiles where id = auth.uid()) = 'writer'
    and (select status from public.profiles where id = auth.uid()) = 'active'
    and author_id in (
      select id::text from public.authors where profile_id = auth.uid()
    )
  );

create policy "writers can delete own posts" on public.posts
  for delete using (
    (select role from public.profiles where id = auth.uid()) = 'writer'
    and author_id in (
      select id::text from public.authors where profile_id = auth.uid()
    )
  );

-- ── 6. Authors RLS — writers can update their own author record ──────────────
drop policy if exists "writers can update own author record" on public.authors;
create policy "writers can update own author record" on public.authors
  for update using (profile_id = auth.uid());
