// Standard CORS headers shared by every Edge Function. The iOS app invokes these
// via supabase.functions.invoke(), which sends the Authorization + apikey headers.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * If the request is a CORS preflight, return a ready 204 response; otherwise null.
 * Usage:  const pre = handleOptions(req); if (pre) return pre;
 */
export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

/** JSON response with CORS headers attached. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
