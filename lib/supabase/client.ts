import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

/**
 * Creates or retrieves a cached Supabase client for use in Client Components ('use client').
 * 
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * (with fallback to NEXT_PUBLIC_SUPABASE_ANON_KEY).
 */
export function createBrowserClient(): SupabaseClient {
  if (client) {
    return client;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase is not configured for this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the active environment in Vercel Project Settings, then redeploy. (.env.local only configures your local computer.)'
    );
  }

  client = createClient(supabaseUrl, supabaseKey);
  return client;
}
