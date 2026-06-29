// generate-day-plan
// Body: { trip_id }
// From the trip's pace, type, transit mode, dates, and the kids' ages, generates
// a GENERIC, kid-aware, pace-aware gentle daily rhythm — one short title plus a
// morning / afternoon / evening sentence per day. Writes trip_days rows.
// Never names a real place (CLAUDE.md guardrail #2).

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { callClaude, extractJson, MODELS } from "../_shared/anthropic.ts";
import { adminClient, getOwnedTrip, getUserId } from "../_shared/supabaseAdmin.ts";
import { NO_REAL_PLACES } from "../_shared/guardrails.ts";

const MAX_DAYS = 14;

interface AiDay {
  day_index: number;
  title: string;
  morning?: string | null;
  afternoon?: string | null;
  evening?: string | null;
}

interface DayPayload {
  days: AiDay[];
}

/** Number of days from start..end inclusive, parsing yyyy-mm-dd as local midnight. */
function dayCount(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (!Number.isFinite(diff) || diff < 1) return 1;
  return diff;
}

/** start_date + offset days, returned as a yyyy-mm-dd string. */
function dateForIndex(startDate: string, offset: number): string {
  const d = new Date(`${startDate}T00:00:00`);
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Generic, place-free fallback so the day plan is never empty. */
function fallbackDays(n: number): AiDay[] {
  const days: AiDay[] = [];
  for (let i = 0; i < n; i++) {
    const isFirst = i === 0;
    const isLast = i === n - 1 && n > 1;
    if (isFirst) {
      days.push({
        day_index: i,
        title: "Arrival & settle in",
        morning: "Travel day — keep it easy and go at the kids' pace.",
        afternoon: "Get to where you're staying and unpack the essentials first.",
        evening: "Simple dinner close by and an early night to reset.",
      });
    } else if (isLast) {
      days.push({
        day_index: i,
        title: "Pack up & head home",
        morning: "Slow start, then pack up together before you check out.",
        afternoon: "Travel home with snacks and a few quiet activities ready.",
        evening: "Wind down at home and let everyone recover.",
      });
    } else {
      days.push({
        day_index: i,
        title: "Explore at an easy pace",
        morning: "Plan the bigger outing now, before the heat and before naps.",
        afternoon: "Head back for downtime, a nap, or some pool time.",
        evening: "Relaxed dinner near where you're staying.",
      });
    }
  }
  return days;
}

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const { trip_id } = await req.json().catch(() => ({}));
    if (!trip_id || typeof trip_id !== "string") {
      return jsonResponse({ created: 0, error: "trip_id is required" }, 400);
    }

    const userId = await getUserId(req);
    if (!userId) return jsonResponse({ created: 0, error: "Unauthorized" }, 401);

    const admin = adminClient();
    const trip = await getOwnedTrip(admin, trip_id, userId);
    if (!trip) return jsonResponse({ created: 0, error: "Trip not found" }, 404);

    const startDate = String(trip.start_date);
    const endDate = String(trip.end_date);
    const nDays = Math.min(dayCount(startDate, endDate), MAX_DAYS);

    // travelers
    const { data: travelerRows } = await admin
      .from("trip_travelers")
      .select("children(name, birth_year, relation, notes)")
      .eq("trip_id", trip_id);

    const thisYear = new Date().getFullYear();
    const children = (travelerRows ?? [])
      .map((r: any) => r.children)
      .filter(Boolean)
      .map((c: any) => ({
        name: c.name as string,
        age: c.birth_year ? Math.max(0, thisYear - (c.birth_year as number)) : null,
        relation: (c.relation as string | null) ?? null,
        notes: (c.notes as string | null) ?? null,
      }));

    const childLines = children.length
      ? children
          .map(
            (c) =>
              `- ${c.name}${c.relation ? ` (${c.relation})` : ""}${c.age != null ? `, age ~${c.age}` : ""}${c.notes ? `, notes: ${c.notes}` : ""}`,
          )
          .join("\n")
      : "- (no travelers listed; plan for a family with young kids)";

    const system = [
      "You are Mosey, a calm family-travel planning assistant.",
      NO_REAL_PLACES,
      "Produce a GENERIC, kid-aware, pace-aware gentle daily rhythm for the trip — never a specific itinerary.",
      "Pace guidance: chill = lots of downtime and slow mornings; balanced = a mix of one outing plus rest; packed = fuller days but still realistic with kids.",
      "For each day give a short title (e.g. 'Arrival & settle in', 'Big adventure day', 'Slow morning, pool afternoon').",
      "Then give morning, afternoon, and evening as ONE short sentence each of GENERIC guidance (e.g. 'Plan the biggest outing now, before the heat and before naps.', 'Back for a nap or pool downtime.', 'Easy dinner near where you're staying, early night.').",
      "Protect nap windows for little kids and never over-pack a day. Respect any hard-nos.",
      "Day 1 (day_index 0) is arrival and settling in. The last day is packing up and travelling home.",
      "Return ONLY raw JSON, no prose, no markdown fences.",
    ].join("\n");

    const user = [
      `Trip: ${trip.name}. Destination: ${trip.destination}. Type: ${trip.trip_type}.`,
      `Transit mode: ${trip.transit_mode}. Pace: ${trip.pace}.`,
      `Dates: ${startDate} to ${endDate}. Plan exactly ${nDays} day(s).`,
      trip.hard_nos ? `Hard-nos (avoid): ${trip.hard_nos}` : "",
      trip.lodging ? `Lodging: ${trip.lodging}.` : "",
      Array.isArray(trip.activities) && trip.activities.length
        ? `Planned activities to work in: ${trip.activities.join(", ")}.`
        : "",
      trip.extra_notes ? `Extra context from the parent: ${trip.extra_notes}` : "",
      "Travelers:",
      childLines,
      "",
      "Return strict JSON of this shape:",
      `{"days":[{"day_index":0,"title":"...","morning":"...","afternoon":"...","evening":"..."}]}`,
      `day_index is 0-based and must cover 0..${nDays - 1} for ${nDays} day(s).`,
    ].filter(Boolean).join("\n");

    let days: AiDay[] | null = null;
    try {
      const text = await callClaude({ model: MODELS.generation, system, user, maxTokens: 2500 });
      const parsed = extractJson<DayPayload>(text);
      if (parsed && Array.isArray(parsed.days)) {
        const valid = parsed.days.filter(
          (d) => d && typeof d === "object" && typeof d.title === "string" && d.title.trim(),
        );
        if (valid.length) days = valid;
      }
    } catch (_e) {
      days = null;
    }

    if (!days) days = fallbackDays(nDays);

    // Map model output by day_index where present; clamp to the computed day count.
    const byIndex = new Map<number, AiDay>();
    days.forEach((d, i) => {
      const idx = typeof d.day_index === "number" && Number.isInteger(d.day_index) ? d.day_index : i;
      if (idx >= 0 && idx < nDays && !byIndex.has(idx)) byIndex.set(idx, d);
    });

    const clean = (v: unknown): string | null =>
      typeof v === "string" && v.trim() ? v.trim() : null;

    const rows: Array<Record<string, unknown>> = [];
    // Insert in day_index order for whatever the model gave (too few is fine).
    const indices = [...byIndex.keys()].sort((a, b) => a - b);
    for (const idx of indices) {
      const d = byIndex.get(idx)!;
      rows.push({
        trip_id,
        day_index: idx,
        date: dateForIndex(startDate, idx),
        title: String(d.title).trim(),
        morning: clean(d.morning),
        afternoon: clean(d.afternoon),
        evening: clean(d.evening),
      });
    }

    // replace prior rows for this trip, insert new
    await admin.from("trip_days").delete().eq("trip_id", trip_id);
    if (rows.length) {
      const { error: insertErr } = await admin.from("trip_days").insert(rows);
      if (insertErr) return jsonResponse({ created: 0, error: "Failed to save day plan" }, 500);
    }

    return jsonResponse({ created: rows.length });
  } catch (_e) {
    return jsonResponse({ created: 0, error: "Unexpected error" }, 500);
  }
});
