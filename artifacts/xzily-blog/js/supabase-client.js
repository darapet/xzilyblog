// Single shared Supabase client for the whole site. Loaded straight from a
// CDN as an ES module -- no bundler/npm install needed, matching this
// project's plain-JS, no-build approach.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
