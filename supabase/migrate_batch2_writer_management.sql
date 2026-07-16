-- Batch 2: Writer Management — suspension, review requests
-- Run once in Supabase Dashboard → SQL Editor → New query

-- ── 1. suspension_cases — one per active suspension/restriction ───────────────
create table if not exists public.suspension_cases (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references auth.users(id) on delete cascade,
  admin_id        uuid references auth.users(id) on delete set null,
  status          text not null default 'active'
                    check (status in ('active','resolved','rejected')),
  reason          text not null default '',
  requirements    jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists suspension_cases_profile_idx on public.suspension_cases(profile_id);
create index if not exists suspension_cases_status_idx  on public.suspension_cases(status);

alter table public.suspension_cases enable row level security;

drop policy if exists "admins can manage suspension cases" on public.suspension_cases;
create policy "admins can manage suspension cases" on public.suspension_cases
  using (public.is_admin());

drop policy if exists "writers can read own suspension cases" on public.suspension_cases;
create policy "writers can read own suspension cases" on public.suspension_cases
  for select using (auth.uid() = profile_id);

-- ── 2. suspension_reviews — review requests submitted by suspended writers ────
create table if not exists public.suspension_reviews (
  id                  uuid primary key default gen_random_uuid(),
  suspension_case_id  uuid not null references public.suspension_cases(id) on delete cascade,
  responses           jsonb not null default '{}'::jsonb,
  status              text not null default 'pending'
                        check (status in ('pending','approved','rejected')),
  submitted_at        timestamptz not null default now(),
  reviewed_at         timestamptz,
  reviewer_id         uuid references auth.users(id) on delete set null
);
create index if not exists suspension_reviews_case_idx   on public.suspension_reviews(suspension_case_id);
create index if not exists suspension_reviews_status_idx on public.suspension_reviews(status);

alter table public.suspension_reviews enable row level security;

drop policy if exists "admins can manage suspension reviews" on public.suspension_reviews;
create policy "admins can manage suspension reviews" on public.suspension_reviews
  using (public.is_admin());

drop policy if exists "writers can insert own review requests" on public.suspension_reviews;
create policy "writers can insert own review requests" on public.suspension_reviews
  for insert with check (
    exists (
      select 1 from public.suspension_cases sc
      where sc.id = suspension_case_id and sc.profile_id = auth.uid() and sc.status = 'active'
    )
  );

drop policy if exists "writers can read own review requests" on public.suspension_reviews;
create policy "writers can read own review requests" on public.suspension_reviews
  for select using (
    exists (
      select 1 from public.suspension_cases sc
      where sc.id = suspension_case_id and sc.profile_id = auth.uid()
    )
  );

-- ── 3. RPC: admin_set_writer_status (security definer, bypasses guard) ────────
create or replace function public.admin_set_writer_status(
  p_profile_id uuid,
  p_status     text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Unauthorized'; end if;
  perform set_config('xzily.internal_call', 'true', true);
  update public.profiles set status = p_status where id = p_profile_id;
end;
$$;
