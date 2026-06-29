// Supabase access helpers for Edge Functions.
//
// We use two clients:
//  - the ADMIN (service-role) client to read/write trip rows server-side; and
//  - a per-request ANON client bound to the caller's JWT, purely to resolve the
//    calling user's id from the Authorization header.
//
// Every function MUST verify the caller owns the trip_id before doing any work,
// so the service-role client (which bypasses RLS) never acts on someone else's
// data. (CLAUDE.md guardrails #1, #7.)

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

/** Service-role client. Bypasses RLS — only use after verifying ownership. */
export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Resolve the calling user's id from the request Authorization header.
 * Returns the uuid string, or null if there is no valid bearer token.
 */
export async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return null;

  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await anon.auth.getUser(jwt);
  if (error || !data?.user) return null;
  return data.user.id;
}

/**
 * Verify the caller owns the trip and return the trip row (admin-scoped).
 * Returns null if the trip does not exist or does not belong to the user.
 */
export async function getOwnedTrip(
  admin: SupabaseClient,
  tripId: string,
  userId: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await admin
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .eq("profile_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}
