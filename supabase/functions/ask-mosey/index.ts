// ask-mosey
// Body: { trip_id, question }
// Bounded reasoning over the trip context. Answers with GENERIC, kid-aware
// guidance on packing, transit prep, "what am I forgetting", and pacing/timing.
// NEVER names a real place. If the user wants a specific real place pick, we set
// deferred=true and return generic guidance instead.

import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { callClaude, extractJson, MODELS } from "../_shared/anthropic.ts";
import { adminClient, getOwnedTrip, getUserId } from "../_shared/supabaseAdmin.ts";
import { NO_REAL_PLACES } from "../_shared/guardrails.ts";

interface AskPayload {
  answer: string;
  suggestions?: string[];
  deferred?: boolean;
}

const FALLBACK_ANSWER =
  "Here's a calm way to think about it: pack the non-clothes first (documents, " +
  "chargers, meds, toiletries), plan the biggest outing for the cooler part of " +
  "the day before anyone's tired, and keep snacks and water within reach. If " +
  "you're flying or doing a long drive, load shows, maps, and playlists before " +
  "you lose wifi. When in doubt, build in more downtime than you think you need.";

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

    // ages for context
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
      : "- (no travelers listed)";

    const system = [
      "You are Mosey, a calm, practical family-travel sidekick.",
      NO_REAL_PLACES,
      "Answer with generic, kid-aware guidance on packing, transit prep, 'what am I forgetting', and pacing/timing.",
      "If the question asks for a specific real place, restaurant, or venue recommendation, do NOT name one. Instead set deferred=true, give generic guidance, and gently note that place picks are coming soon.",
      "Keep the answer warm and concise (a few sentences). Optionally include a few short suggestion chips.",
      "Return ONLY raw JSON, no prose, no markdown fences.",
    ].join("\n");

    const user = [
      `Trip: ${trip.name} — destination "${trip.destination}".`,
      `Type: ${trip.trip_type}. Transit: ${trip.transit_mode}. Pace: ${trip.pace}.`,
      `Dates: ${trip.start_date} to ${trip.end_date}.`,
      trip.hard_nos ? `Hard-nos: ${trip.hard_nos}` : "",
      "Children:",
      childLines,
      "",
      `Parent's question: ${question}`,
      "",
      "Return strict JSON of this shape:",
      `{"answer":"string","suggestions":["short string", "..."],"deferred":false}`,
    ].filter(Boolean).join("\n");

    let reply: AskPayload | null = null;
    try {
      const text = await callClaude({ model: MODELS.generation, system, user, maxTokens: 1000 });
      const parsed = extractJson<AskPayload>(text);
      if (parsed && typeof parsed.answer === "string" && parsed.answer.trim()) {
        reply = {
          answer: parsed.answer.trim(),
          suggestions: Array.isArray(parsed.suggestions)
            ? parsed.suggestions.filter((s) => typeof s === "string").slice(0, 6)
            : undefined,
          deferred: parsed.deferred === true,
        };
      }
    } catch (_e) {
      reply = null;
    }

    if (!reply) {
      // safe fallback — never crash the screen
      reply = { answer: FALLBACK_ANSWER };
    }

    return jsonResponse(reply);
  } catch (_e) {
    return jsonResponse({ answer: FALLBACK_ANSWER });
  }
});
