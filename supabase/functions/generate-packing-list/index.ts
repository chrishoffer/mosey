// generate-packing-list
// Body: { trip_id }
// Generates per-child + shared packing items tailored to the trip, writes them
// as source='ai' rows (replacing any prior AI rows). Never names a real place.

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { callClaude, extractJson, MODELS } from "../_shared/anthropic.ts";
import { adminClient, getOwnedTrip, getUserId } from "../_shared/supabaseAdmin.ts";
import { NO_REAL_PLACES } from "../_shared/guardrails.ts";

interface AiPackingItem {
  child_name: string | null; // null = shared
  label: string;
  category: string;
  reason?: string | null;
  amazon_query?: string | null; // physical goods only
}

interface PackingPayload {
  items: AiPackingItem[];
}

/** Generic, place-free fallback so the screen is never empty. */
function fallbackItems(): Array<{ label: string; category: string; reason: string | null; amazon_query: string | null }> {
  return [
    { label: "Sunscreen (kid-safe SPF)", category: "Health", reason: "Easy to forget, hard to replace mid-trip.", amazon_query: "kids mineral sunscreen spf 50" },
    { label: "Refillable water bottles", category: "Gear", reason: "Keeps everyone hydrated and cuts waste.", amazon_query: "kids refillable water bottle" },
    { label: "First-aid kit", category: "Health", reason: "Bandages, antiseptic, and the basics for scrapes.", amazon_query: "travel first aid kit" },
    { label: "Chargers & cables", category: "Tech", reason: "Pack the non-clothes first.", amazon_query: null },
    { label: "Reusable snacks pouch", category: "Food", reason: "A hungry kid is a hard kid.", amazon_query: "reusable snack bags" },
    { label: "Medications (fever, allergy, motion)", category: "Health", reason: "Restock before you go.", amazon_query: null },
    { label: "Comfort item per kid", category: "Comfort", reason: "Familiar things help in new places.", amazon_query: null },
  ];
}

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    // --- input ---
    const { trip_id } = await req.json().catch(() => ({}));
    if (!trip_id || typeof trip_id !== "string") {
      return jsonResponse({ error: "trip_id is required" }, 400);
    }

    // --- auth + ownership ---
    const userId = await getUserId(req);
    if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);

    const admin = adminClient();
    const trip = await getOwnedTrip(admin, trip_id, userId);
    if (!trip) return jsonResponse({ error: "Trip not found" }, 404);

    // --- load travelers (children on this trip) ---
    const { data: travelerRows } = await admin
      .from("trip_travelers")
      .select("child_id, children(id, name, birth_year, notes)")
      .eq("trip_id", trip_id);

    const thisYear = new Date().getFullYear();
    const children = (travelerRows ?? [])
      .map((r: any) => r.children)
      .filter(Boolean)
      .map((c: any) => ({
        id: c.id as string,
        name: c.name as string,
        age: Math.max(0, thisYear - (c.birth_year as number)),
        notes: (c.notes as string | null) ?? null,
      }));

    // map name -> id (lowercased) for assigning AI items to children
    const nameToId = new Map<string, string>();
    for (const c of children) nameToId.set(c.name.toLowerCase(), c.id);

    // --- load past trip notes for context ---
    const { data: noteRows } = await admin
      .from("trip_notes")
      .select("hits, misses")
      .eq("trip_id", trip_id);

    // --- build prompt ---
    const childLines = children.length
      ? children.map((c) => `- ${c.name}, age ~${c.age}${c.notes ? `, notes: ${c.notes}` : ""}`).join("\n")
      : "- (no children listed; produce shared-only items)";

    const noteLines = (noteRows ?? [])
      .map((n: any) => [n.hits ? `hits: ${n.hits}` : "", n.misses ? `misses: ${n.misses}` : ""].filter(Boolean).join("; "))
      .filter(Boolean)
      .join("\n");

    const system = [
      "You are Mosey, a calm family-travel packing assistant.",
      NO_REAL_PLACES,
      "Tailor items to the destination type, transit, pace, kids' ages, kid notes, and hard-nos.",
      "Each item must be a real, generic packing item (no places, no brands of venues).",
      "Set amazon_query ONLY for physical goods a parent could buy; otherwise null.",
      "Use child_name to assign a kid-specific item; use null for shared items.",
      "Return ONLY raw JSON, no prose, no markdown fences.",
    ].join("\n");

    const user = [
      `Trip: ${trip.name} — destination "${trip.destination}".`,
      `Type: ${trip.trip_type}. Transit: ${trip.transit_mode}. Pace: ${trip.pace}.`,
      `Dates: ${trip.start_date} to ${trip.end_date}.`,
      trip.hard_nos ? `Hard-nos (do NOT suggest these): ${trip.hard_nos}` : "",
      "Children:",
      childLines,
      noteLines ? `Notes from past trips:\n${noteLines}` : "",
      "",
      "Return strict JSON of this shape:",
      `{"items":[{"child_name": null, "label": "string", "category": "string", "reason": "short string or null", "amazon_query": "string or null"}]}`,
      "Use the exact child names above for child-specific items; null means shared.",
    ].filter(Boolean).join("\n");

    // --- call model + parse defensively ---
    let items: AiPackingItem[] | null = null;
    try {
      const text = await callClaude({ model: MODELS.generation, system, user, maxTokens: 2000 });
      const parsed = extractJson<PackingPayload>(text);
      if (parsed && Array.isArray(parsed.items)) {
        items = parsed.items.filter(
          (it) => it && typeof it.label === "string" && typeof it.category === "string",
        );
      }
    } catch (_e) {
      items = null; // fall through to fallback
    }

    // --- build rows to insert ---
    let rows: Array<Record<string, unknown>>;
    if (items && items.length) {
      rows = items.map((it) => {
        const cid = it.child_name ? nameToId.get(String(it.child_name).toLowerCase()) ?? null : null;
        return {
          trip_id,
          child_id: cid,
          label: it.label,
          category: it.category,
          reason: typeof it.reason === "string" && it.reason.trim() ? it.reason.trim() : null,
          amazon_query: typeof it.amazon_query === "string" && it.amazon_query.trim() ? it.amazon_query.trim() : null,
          is_packed: false,
          source: "ai",
        };
      });
    } else {
      // fallback set — shared items so the screen is never empty
      rows = fallbackItems().map((f) => ({
        trip_id,
        child_id: null,
        label: f.label,
        category: f.category,
        reason: f.reason,
        amazon_query: f.amazon_query,
        is_packed: false,
        source: "ai",
      }));
    }

    // --- replace prior AI rows, insert new ---
    await admin.from("packing_items").delete().eq("trip_id", trip_id).eq("source", "ai");
    const { error: insertErr } = await admin.from("packing_items").insert(rows);
    if (insertErr) return jsonResponse({ error: "Failed to save packing items" }, 500);

    return jsonResponse({ created: rows.length });
  } catch (_e) {
    // Never leak the key or a stack trace.
    return jsonResponse({ error: "Unexpected error" }, 500);
  }
});
