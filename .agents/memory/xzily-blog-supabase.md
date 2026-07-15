---
name: Xzily blog Supabase backend
description: How the darapet/xzilyblog static site talks to Supabase, and the constraints that shaped it.
---

The site (artifacts/xzily-blog) is a plain multi-page HTML/JS app with no bundler-required
runtime deps — Vite is only a dev/build server. To keep that no-build-step property while adding
a real backend, the Supabase client is imported directly from an ESM CDN
(`https://esm.sh/@supabase/supabase-js@2`) rather than added as an npm dependency. Vite leaves
full-URL imports untouched in both dev and build, so this works without touching package.json.

**Why:** the user explicitly forbade building/deploying a Replit-hosted backend and wanted the
existing frontend untouched — Supabase (Postgres + Auth) acts as the entire backend, called
straight from browser JS.

**How to apply:** if extending this site's backend further, keep using the same CDN-import
pattern for any other browser-callable service client, and keep schema/RLS changes in
`supabase/schema.sql` (idempotent `create table if not exists` / `drop trigger if exists` style)
since the agent only has the anon key and cannot run migrations itself — the user must paste SQL
into the Supabase SQL editor manually.

Key design decisions worth being consistent with:
- Editorial "authors" (byline shown on posts) stay a fixed static list in `js/data.js`, not tied
  to real Supabase Auth accounts — only readers/admins get real accounts.
- Likes/bookmarks/comments require sign-in (no anonymous writes) because Supabase RLS needs a
  real `auth.uid()` to attribute rows; comment `author_id` is nullable to allow SQL-seeded demo
  comments without a real user.
- Admin access is a `profiles.is_admin` boolean, guarded by BEFORE INSERT/UPDATE triggers so a
  regular user can never self-promote via a direct API call. New admins must be created by
  signing up normally, then an existing admin (or the user via Supabase dashboard) flips
  `is_admin = true` on their `profiles` row — there is no self-service admin signup.
