-- Batch 5: External library books toggle
-- Run once in Supabase Dashboard → SQL Editor → New query

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS external_library_enabled boolean NOT NULL DEFAULT true;
