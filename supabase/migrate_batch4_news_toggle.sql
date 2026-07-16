-- Batch 4: External news toggle
-- Run once in Supabase Dashboard → SQL Editor → New query

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS external_news_enabled boolean NOT NULL DEFAULT true;
