// ask-mosey
// Body: { trip_id, question }
// Bounded reasoning over the trip context. Answers with GENERIC, kid-aware
// guidance on packing, transit prep, "what am I forgetting", and pacing/timing —
// AND can now take actions on the trip when the parent clearly asks to add /
// remind / track / save something (add a reminder, a packing item, a transit-kit
// item, a home checklist task, or a logistics note).
// NEVER names a real place. If the user wants a specific real place pick, we set
// deferred=true and return generic guidance instead.

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { callClaude, extractJson, MODELS } from "../_shared/anthropic.ts";
import { adminClient, getOwnedTrip, getUserId } from "../_shared/supabaseAdmin.ts";
import { NO_REAL_PLACES } from "../_shared/guardrails.ts";

// ---- Action shapes the MODEL is allowed to emit. We re-validate every one of
// these server-side before touching the database; anything that doesn't match
// exactly is skipped (never inserted as junk). ----
interface AddReminderAction {
  type: "add_reminder";
  title: string;
  body?: string | null;
  lead_days: number;
}
interface AddPackingAction {
  type: "add_packing";
  label: string;
  category?: string | null;
  child_name?: string | null;
}
interface AddTransitAction {
  type: "add_transit";
  kind: "carryon" | "download" | "activity" | "playlist";
  label: string;
  detail?: string | null;
  child_name?: string | null;
}
interface AddHomeTaskAction {
  type: "add_home_task";
  label: string;
}
interface AddLogisticsAction {
  type: "add_logistics";
  kind:
    | "lodging"
    | "flight"
    | "ground"
    | "reservation"
    | "confirmation"
    | "contact"
    | "other";
  label: string;
  detail?: string | null;
}

type Action =
  | AddReminderAction
  | AddPackingAction
  | AddTransitAction
  | AddHomeTaskAction
  | AddLogisticsAction;

interface AskPayload {
  answer: string;
  actions?: unknown[];
  deferred?: boolean;
}

/** A simplified record of what we actually wrote, returned to the client so it
 *  can show "Added: X" chips and know to refresh. */
interface PerformedAction {
  type: string;
  label: string;
}

const TRANSIT_KINDS = ["carryon", "download", "activity", "playlist"];
const LOGISTICS_KINDS = [
  "lodging",
  "flight",
  "ground",
  "reservation",
  "confirmation",
  "contact",
  "other",
];

const FALLBACK_ANSWER =
  "Here's a calm way to think about it: pack the non-clothes first (documents, " +
  "chargers, meds, toiletries), plan the biggest outing for the cooler part of " +
  "the day before anyone's tired, and keep snacks and water within reach. If " +
  "you're flying or doing a long drive, load shows, maps, and playlists before " +
  "you lose wifi. When in doubt, build in more downtime than you think you need.";

/** 09:00 local on (startDate - leadDays), as an ISO string — same rule as
 *  src/data/timeline.ts. Returns null if startDate is unparseable. */
function fireAt(startDate: unknown, leadDays: number): string | null {
  if (typeof startDate !== "string" || !startDate.trim()) return null;
  try {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return null;
    const day = new Date(start.getTime());
    day.setDate(day.getDate() - leadDays);
    day.setHours(9, 0, 0, 0);
    return day.toISOString();
  } catch {
    return null;
  }
}

function clampLeadDays(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const i = Math.round(n);
  if (i < 0 || i > 400) return null;
  return i;
}

function nonEmptyString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function nullableString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const { trip_id, question } = await req.json().catch(() => ({}));
    if (!trip_id || typeof trip_id !== "string") {
      return jsonResponse({ error: "trip_id is required" }, 400);
    }
    if (!question || typeof question !== "string") {
      return jsonResponse({ error: "question is required" }, 400);
    }

    const userId = await getUserId(req);
    if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);

    const admin = adminClient();
    const trip = await getOwnedTrip(admin, trip_id, userId);
    if (!trip) return jsonResponse({ error: "Trip not found" }, 404);

    // Travelers — loaded once. Used both for context AND to resolve child_name
    // -> child_id (case-insensitive). Absent / unknown name => null = shared.
    const { data: travelerRows } = await admin
      .from("trip_travelers")
      .select("children(id, name, birth_year, relation, notes)")
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

    // lowercased name -> id map for child_name resolution.
    const childIdByName = new Map<string, string>();
    for (const c of children) {
      if (c.name) childIdByName.set(c.name.toLowerCase().trim(), c.id);
    }
    const resolveChildId = (name: unknown): string | null => {
      const n = nonEmptyString(name);
      if (!n) return null;
      return childIdByName.get(n.toLowerCase()) ?? null;
    };

    const childLines = children.length
      ? children
          .map(
            (c) =>
              `- ${c.name}${c.relation ? ` (${c.relation})` : ""}${c.age != null ? `, age ~${c.age}` : ""}${c.notes ? `, notes: ${c.notes}` : ""}`,
          )
          .join("\n")
      : "- (no travelers listed)";

    const activities = Array.isArray(trip.activities)
      ? (trip.activities as unknown[]).filter((a) => typeof a === "string").join(", ")
      : "";

    const system = [
      "You are Mosey, a calm, practical family-travel sidekick.",
      NO_REAL_PLACES,
      "You can do TWO things in one reply: (1) ANSWER the parent with generic, kid-aware guidance on packing, transit prep, 'what am I forgetting', and pacing/timing; and (2) propose ACTIONS that add things to this trip when — and only when — the parent clearly asks to add, remind, track, or save something. A pure question gets an empty actions array.",
      "If the question asks for a specific real place, restaurant, or venue recommendation, do NOT name one. Instead set deferred=true, give generic guidance, and gently note that place picks are coming soon.",
      "Keep the answer warm and concise (a few sentences). If you performed actions, say so plainly (e.g. 'Added water shoes to your packing list.').",
      "",
      "ACTION TYPES you may emit (only the fields shown; emit only actions the parent asked for):",
      '1. {"type":"add_reminder","title":"...","body":"... or null","lead_days":<int 0..400>} — a timeline nudge. lead_days = number of DAYS BEFORE the trip start date it should fire. Infer it from natural language: "2 months"≈60, "10 weeks"≈70, "3 days"=3, "the night before"=1, "a week before"=7.',
      '2. {"type":"add_packing","label":"...","category":"... or null","child_name":"... or null"} — a packing item. category defaults to "Custom". child_name must match a listed traveler (case-insensitive) or be null for a shared item.',
      '3. {"type":"add_transit","kind":"carryon|download|activity|playlist","label":"...","detail":"... or null","child_name":"... or null"} — a Getting There / transit-kit item.',
      '4. {"type":"add_home_task","label":"..."} — a "leaving home" checklist task (hold mail, pet sitter, water plants…).',
      '5. {"type":"add_logistics","kind":"lodging|flight|ground|reservation|confirmation|contact|other","label":"...","detail":"... or null"} — a logistics note (confirmation #, check-in time, contact…).',
      "Never name a real place in the answer OR in any action field.",
      "Return ONLY raw JSON, no prose, no markdown fences.",
    ].join("\n");

    const user = [
      `Trip: ${trip.name} — destination "${trip.destination}".`,
      `Type: ${trip.trip_type}. Transit: ${trip.transit_mode}. Pace: ${trip.pace}.`,
      `Dates: ${trip.start_date} to ${trip.end_date}.`,
      trip.lodging ? `Lodging: ${trip.lodging}` : "",
      activities ? `Activities: ${activities}` : "",
      trip.extra_notes ? `Notes from the parent: ${trip.extra_notes}` : "",
      trip.hard_nos ? `Hard-nos: ${trip.hard_nos}` : "",
      "Children:",
      childLines,
      "",
      `Parent's question: ${question}`,
      "",
      "Return strict JSON of exactly this shape:",
      `{"answer":"string","actions":[],"deferred":false}`,
    ].filter(Boolean).join("\n");

    let answer: string | null = null;
    let deferred = false;
    let rawActions: unknown[] = [];

    try {
      const text = await callClaude({ model: MODELS.generation, system, user, maxTokens: 1200 });
      const parsed = extractJson<AskPayload>(text);
      if (parsed && typeof parsed.answer === "string" && parsed.answer.trim()) {
        answer = parsed.answer.trim();
        deferred = parsed.deferred === true;
        rawActions = Array.isArray(parsed.actions) ? parsed.actions : [];
      }
    } catch (_e) {
      answer = null;
    }

    if (!answer) {
      // safe fallback — never crash the screen
      return jsonResponse({ answer: FALLBACK_ANSWER, actions: [], deferred: false });
    }

    // ---- Validate + execute each action. Invalid actions are skipped; a failed
    // insert skips just that one, never the whole request. ----
    const performed: PerformedAction[] = [];

    for (const raw of rawActions) {
      if (!raw || typeof raw !== "object") continue;
      const a = raw as Record<string, unknown>;

      try {
        if (a.type === "add_reminder") {
          const title = nonEmptyString(a.title);
          const lead = clampLeadDays(a.lead_days);
          if (!title || lead === null) continue;
          const row = {
            trip_id,
            title,
            body: nullableString(a.body),
            lead_days: lead,
            kind: "nudge",
            is_done: false,
            notify_at: fireAt(trip.start_date, lead),
          };
          const { error } = await admin.from("timeline_events").insert(row);
          if (!error) performed.push({ type: "add_reminder", label: title });
        } else if (a.type === "add_packing") {
          const label = nonEmptyString(a.label);
          if (!label) continue;
          const row = {
            trip_id,
            child_id: resolveChildId(a.child_name),
            label,
            category: nonEmptyString(a.category) ?? "Custom",
            reason: null,
            is_packed: false,
            amazon_query: null,
            source: "manual",
          };
          const { error } = await admin.from("packing_items").insert(row);
          if (!error) performed.push({ type: "add_packing", label });
        } else if (a.type === "add_transit") {
          const label = nonEmptyString(a.label);
          const kind = typeof a.kind === "string" ? a.kind : "";
          if (!label || !TRANSIT_KINDS.includes(kind)) continue;
          const row = {
            trip_id,
            child_id: resolveChildId(a.child_name),
            kind,
            label,
            detail: nullableString(a.detail),
            is_done: false,
          };
          const { error } = await admin.from("transit_items").insert(row);
          if (!error) performed.push({ type: "add_transit", label });
        } else if (a.type === "add_home_task") {
          const label = nonEmptyString(a.label);
          if (!label) continue;
          const row = {
            trip_id,
            label,
            is_done: false,
            source: "manual",
          };
          const { error } = await admin.from("home_tasks").insert(row);
          if (!error) performed.push({ type: "add_home_task", label });
        } else if (a.type === "add_logistics") {
          const label = nonEmptyString(a.label);
          const kind = typeof a.kind === "string" ? a.kind : "";
          if (!label || !LOGISTICS_KINDS.includes(kind)) continue;
          const row = {
            trip_id,
            kind,
            label,
            detail: nullableString(a.detail),
          };
          const { error } = await admin.from("logistics_items").insert(row);
          if (!error) performed.push({ type: "add_logistics", label });
        }
        // any other type is unknown -> ignored
      } catch (_e) {
        // never fail the whole request on one bad action
        continue;
      }
    }

    return jsonResponse({ answer, actions: performed, deferred });
  } catch (_e) {
    return jsonResponse({ answer: FALLBACK_ANSWER, actions: [], deferred: false });
  }
});
