// generate-transit-kit
// Body: { trip_id }
// From transit_mode + kids' ages, generates per-kid carry-on lists, a
// "download before you lose wifi" checklist, screen-light activities/games, and
// playlist ideas. Writes transit_items rows. Never names a real place.

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { callClaude, extractJson, MODELS } from "../_shared/anthropic.ts";
import { adminClient, getOwnedTrip, getUserId } from "../_shared/supabaseAdmin.ts";
import { NO_REAL_PLACES } from "../_shared/guardrails.ts";

type TransitKind = "carryon" | "download" | "activity" | "playlist";
const VALID_KINDS: TransitKind[] = ["carryon", "download", "activity", "playlist"];

interface AiTransitItem {
  kind: TransitKind;
  child_name: string | null; // null = shared
  label: string;
  detail?: string | null;
}

interface TransitPayload {
  items: AiTransitItem[];
}

/** Generic, place-free fallback so the kit is never empty. */
function fallbackItems(): Array<{ kind: TransitKind; label: string; detail: string | null }> {
  return [
    { kind: "carryon", label: "Snacks & a spill-proof water bottle", detail: "Easy reach for the journey.", },
    { kind: "carryon", label: "Change of clothes per kid", detail: "Accidents and spills happen.", },
    { kind: "carryon", label: "Wipes & a small trash bag", detail: "Cleanup on the go.", },
    { kind: "download", label: "Offline shows & movies", detail: "Load every device before you lose wifi.", },
    { kind: "download", label: "Offline maps & boarding passes", detail: "Don't rely on signal at the gate.", },
    { kind: "activity", label: "Sticker book or coloring pad", detail: "Quiet, screen-free, low mess.", },
    { kind: "activity", label: "Travel-friendly card or guessing games", detail: "Good for waiting in lines.", },
    { kind: "playlist", label: "Family sing-along playlist", detail: "Build it together before you leave.", },
  ];
}

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const { trip_id } = await req.json().catch(() => ({}));
    if (!trip_id || typeof trip_id !== "string") {
      return jsonResponse({ error: "trip_id is required" }, 400);
    }

    const userId = await getUserId(req);
    if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);

    const admin = adminClient();
    const trip = await getOwnedTrip(admin, trip_id, userId);
    if (!trip) return jsonResponse({ error: "Trip not found" }, 404);

    // travelers
    const { data: travelerRows } = await admin
      .from("trip_travelers")
      .select("child_id, children(id, name, birth_year, relation, notes)")
      .eq("trip_id", trip_id);

    const thisYear = new Date().getFullYear();
    const children = (travelerRows ?? [])
      .map((r: any) => r.children)
      .filter(Boolean)
      .map((c: any) => ({
        id: c.id as string,
        name: c.name as string,
        age: c.birth_year ? Math.max(0, thisYear - (c.birth_year as number)) : null,
        relation: (c.relation as string | null) ?? null,
        notes: (c.notes as string | null) ?? null,
      }));

    const nameToId = new Map<string, string>();
    for (const c of children) nameToId.set(c.name.toLowerCase(), c.id);

    const childLines = children.length
      ? children
          .map(
            (c) =>
              `- ${c.name}${c.relation ? ` (${c.relation})` : ""}${c.age != null ? `, age ~${c.age}` : ""}${c.notes ? `, notes: ${c.notes}` : ""}`,
          )
          .join("\n")
      : "- (no travelers listed; produce shared-only items)";

    const system = [
      "You are Mosey, a calm family-travel transit-kit assistant.",
      NO_REAL_PLACES,
      "Generate a getting-there kit: per-kid carry-on items, a download-before-you-lose-wifi checklist, screen-light activities/games, and playlist ideas.",
      "Each item has a kind: one of carryon | download | activity | playlist.",
      "Use child_name to assign a kid-specific item; use null for shared items.",
      "Tailor to the transit mode and the kids' ages. No real places, no specific venues.",
      "Return ONLY raw JSON, no prose, no markdown fences.",
    ].join("\n");

    const user = [
      `Trip: ${trip.name}. Transit mode: ${trip.transit_mode}. Pace: ${trip.pace}.`,
      `Dates: ${trip.start_date} to ${trip.end_date}.`,
      trip.hard_nos ? `Hard-nos (avoid): ${trip.hard_nos}` : "",
      "Children:",
      childLines,
      "",
      "Return strict JSON of this shape:",
      `{"items":[{"kind":"carryon|download|activity|playlist","child_name": null, "label":"string","detail":"short string or null"}]}`,
      "Use the exact child names above for kid-specific items; null means shared.",
    ].filter(Boolean).join("\n");

    let items: AiTransitItem[] | null = null;
    try {
      const text = await callClaude({ model: MODELS.generation, system, user, maxTokens: 2000 });
      const parsed = extractJson<TransitPayload>(text);
      if (parsed && Array.isArray(parsed.items)) {
        items = parsed.items.filter(
          (it) =>
            it &&
            typeof it.label === "string" &&
            VALID_KINDS.includes(it.kind as TransitKind),
        );
      }
    } catch (_e) {
      items = null;
    }

    let rows: Array<Record<string, unknown>>;
    if (items && items.length) {
      rows = items.map((it) => {
        const cid = it.child_name ? nameToId.get(String(it.child_name).toLowerCase()) ?? null : null;
        return {
          trip_id,
          child_id: cid,
          kind: it.kind,
          label: it.label,
          detail: typeof it.detail === "string" && it.detail.trim() ? it.detail.trim() : null,
          is_done: false,
        };
      });
    } else {
      rows = fallbackItems().map((f) => ({
        trip_id,
        child_id: null,
        kind: f.kind,
        label: f.label,
        detail: f.detail,
        is_done: false,
      }));
    }

    // replace prior rows for this trip, insert new
    await admin.from("transit_items").delete().eq("trip_id", trip_id);
    const { error: insertErr } = await admin.from("transit_items").insert(rows);
    if (insertErr) return jsonResponse({ error: "Failed to save transit kit" }, 500);

    return jsonResponse({ created: rows.length });
  } catch (_e) {
    return jsonResponse({ error: "Unexpected error" }, 500);
  }
});
