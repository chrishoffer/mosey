# Mosey — Global Guardrails (read me first)

Mosey is a **family-travel sidekick** for parents. iOS app (Expo / React Native).
One-sentence job: **Put the trip down. Mosey holds the whole timeline and taps you at the right moment.**

Every subagent inherits this file. These rules are **non-negotiable**.

## Hard lines (NEVER cross)

1. **The Anthropic API key NEVER touches the client.** All Claude calls go through a
   Supabase Edge Function that holds the key as a secret. If `ANTHROPIC_API_KEY`
   ever appears in app code, a bundled `.env`, or anything shipped to the device —
   **stop and re-route.** The client only ever calls our Edge Functions.
2. **Hallucination guardrail (critical).** AI may generate packing, prep, transit
   kits, and **generic** planning guidance only. **Never name a specific real place,
   restaurant, tour, beach, or venue anywhere in v1** — not in planning, not in Ask
   Mosey. Generic is fine ("plan the big outing for the cooler morning, before
   naps"). Named is forbidden ("go to X Beach"). Naming real places requires a real
   data source (a later phase). A wrong packing item is harmless; a fake place
   destroys trust.

## Other constraints

3. **Models (pinned IDs, no aliases in production):**
   - `claude-sonnet-4-6` — real generation (packing, transit kit, planning guidance).
   - `claude-haiku-4-5` — cheap, simple, high-frequency calls.
4. **Strict-JSON AI output.** Instruct Claude to return JSON only (no prose, no code
   fences). Parse defensively, validate the shape, and fall back sanely. **Never
   crash a screen on a bad AI response.**
5. **Everything belongs to a trip.** No floating data.
6. **Secrets** live in Supabase secrets / env config, never committed. The client
   uses only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
7. **RLS on every table.** A user can only ever read/write rows that belong to their
   own `profile_id`, enforced at the database level.

## Tech stack (use exactly this)

- App: Expo + React Native (TypeScript), Expo Router.
- Backend/DB/Auth: Supabase (Postgres + Auth + Edge Functions).
- AI: Anthropic API, called **only** from a Supabase Edge Function.
- Subscriptions: RevenueCat (scaffold; v1 runs free behind a stubbed paywall).
- Affiliate: Amazon Associates outbound links (physical goods only).
- Notifications: Expo Notifications (local notifications are fine for v1).

## Design source of truth

`mosey-concept-v3.html` is the visual source of truth (request from human if absent).
Until provided, follow the §8 design tokens in `src/theme/`. Warm, playful, calm —
*Mosey* means unhurried. Each trip carries a color.

## Working agreements

- Decide execution-level questions yourself; log meaningful choices to `DECISIONS.md`.
- Log ideas to `IDEAS.md`; deferred-but-good ideas to `FUTURE.md`. Don't silently
  build un-approved ideas; don't silently drop them.
- Definition-of-done gate for every feature: built → **QA** → **Design** →
  **Customer** → **Skeptic** sign-off. See `.claude/agents/`.
- Amazon button label is exactly **"Buy on Amazon"**, opens system browser, physical
  goods only, never imply "added to cart".

## Expo version note

Expo SDK 56 / React Native 0.85 / React 19. Read the exact versioned docs at
https://docs.expo.dev/versions/v56.0.0/ before writing native-touching code.
