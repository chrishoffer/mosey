# IDEAS

Proposals surfaced along the way. The human promotes these into scope; they are NOT
built until promoted (the Skeptic enforces this). Newest first.

## From the Customer agent's review (2026-06-29)

- **Cruise-native "Getting there" framing.** For trip_type=cruise, the transit kit and day
  plan read airline-generic (no embarkation-day guidance like lanyards / muster drill / sail-away
  nap timing — all generic, no named places, so guardrail-safe). Candidate for promotion.
- **Draft-save on the new-trip form.** One interruption mid-form loses typed input; persist a
  lightweight draft so a toddler-grab isn't fatal.
- **Pre-trip "are the kid notes still right?" check.** Surface each traveler's saved notes for a
  quick confirm ~2 weeks out (fears/foods change fast at these ages).
- **Non-kid travelers should shape output more.** Grandma with a mobility note should change
  pacing/packing more than "another kid" does. Partially handled via relation+notes in prompts;
  verify with the dogfood scenario.

## Surfaced in Phase 1

- **Per-trip "trip readiness" ring.** A single calm progress indicator on the active
  trip card that blends packing %, timeline tasks done, and transit-kit done — one
  glance tells a parent how ready they are. Low risk, high reassurance. (Candidate
  for promotion.)
- **Offline-first packing check-off.** Parents pack in basements/cars with no signal.
  TanStack Query + a mutation queue could make check-offs work offline and sync
  later. Adds complexity; defer unless dogfood shows it matters.
- **"What changed since you last looked" digest.** When a parent reopens an active
  trip, a one-line summary of the next nudge. Cheap, uses existing data.
- **Sibling-aware packing de-dupe.** Shared items (sunscreen) auto-collapse across
  kids so the list isn't 3× as long. Partially covered by the shared/child-null
  split already; could be smarter.
- **Haiku-powered "quick add" parsing.** Type "rash guards for the twins" → structured
  packing items via the cheap model. Nice, but watch scope and cost.
