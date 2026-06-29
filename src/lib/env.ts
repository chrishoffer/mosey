/**
 * Client environment. Only EXPO_PUBLIC_* values are readable here — these ship in
 * the bundle and must never contain secrets. The Anthropic key lives in Supabase
 * secrets and is only ever read inside Edge Functions (see CLAUDE.md guardrail #1).
 */

export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  amazonTag: process.env.EXPO_PUBLIC_AMAZON_ASSOCIATE_TAG ?? '',
};

/** True when the app is wired to a real Supabase project. Screens use this to show
 *  a friendly "not configured" state instead of crashing during local bring-up. */
export const isSupabaseConfigured =
  env.supabaseUrl.startsWith('http') && env.supabaseAnonKey.length > 20;
