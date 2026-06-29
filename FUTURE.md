# FUTURE (out of scope for v1)

Captured deliberately. The Skeptic guards this line. These need either real data
sources or scope the v1 brief explicitly excludes (§12).

## Hard out-of-scope for v1 (§12)

- **Confirmation-email import.** Forward a booking → trip builds itself (TripIt's
  killer onboarding). Big win later; needs email parsing + a parser service.
- **"When to leave for the airport."** Live location + traffic + kid chaos-buffer.
  Needs location + a traffic/maps API.
- **Smart road-trip stops / any named real places.** Requires a real places API
  (e.g. Google Places). **Never freestyle a place.** This is the gate that lets Ask
  Mosey answer "where specifically should we go" — until it exists, those prompts
  resolve to generic guidance or "coming soon".
- **Day-by-day itinerary scheduling with real venues.**
- **Trip sharing / collaboration** between co-parents.
- **Web companion app.**

## Deferred from v1 by the human

- **Amazon Associates / Buy on Amazon (2026-06-29).** Pulled from the shipped v1 surface
  at the human's request ("kill amazon associates for now"). The capability is intact and
  reversible: `src/lib/amazon.ts` (+ its test) stays, AI still emits `amazon_query` on
  packing items, and the only UI change to bring it back is rendering a "Buy on Amazon"
  button in `PackingPanel` when `item.amazon_query` is present, plus setting
  `EXPO_PUBLIC_AMAZON_ASSOCIATE_TAG`.

## Why these wait

The hallucination guardrail (CLAUDE.md) forbids naming real places without a real
data source. Every item above either crosses that line or needs an integration the
v1 brief defers. They are good — they are just not v1.
