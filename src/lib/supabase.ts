import type { SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
// Vercel's Supabase integration names this variable VITE_SUPABASE_PUBLISHABLE_KEY,
// the Supabase docs use VITE_SUPABASE_ANON_KEY. Accept either so a deploy does not
// silently fall back to the local demo workspace.
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * The app runs in two modes:
 *  - configured: real Supabase auth + Postgres persistence
 *  - unconfigured (or under test): the local demo workspace, stored in localStorage
 *
 * Keeping the fallback means `npm run dev` works with no env file, and the test suite
 * never touches the network.
 */
export const backendConfigured = Boolean(url && anonKey) && import.meta.env.MODE !== 'test';

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * The SDK is ~200 kB, and it is only needed once someone signs in. Loading it through a
 * dynamic import keeps it out of the marketing pages' critical path.
 */
export function getSupabase(): Promise<SupabaseClient> | null {
  if (!backendConfigured) return null;

  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(url as string, anonKey as string, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }),
    );
  }

  return clientPromise;
}
