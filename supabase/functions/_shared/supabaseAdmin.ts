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
 * Verify the caller may act on the trip and return the trip row (admin-scoped).
 * Mirrors the database's can_access() rule: the caller either OWNS the trip's
 * account, or is an ACTIVE member of it (whole-account sharing, migration 0004).
 * Returns null if the trip does not exist or the caller has no access.
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
    .maybeSingle();
  if (error || !data) return null;

  const ownerId = (data as { profile_id?: string }).profile_id;
  if (!ownerId) return null;
  if (ownerId === userId) return data as Record<string, unknown>;

  // Shared account: allow an active member of the owner's account.
  const { data: membership } = await admin
    .from("account_members")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("member_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (membership) return data as Record<string, unknown>;

  return null;
}
