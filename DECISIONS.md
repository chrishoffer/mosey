# DECISIONS

Execution-level choices made autonomously. Newest first. Each: what + why.

## Phase boundary check-in (after Phases 1–10 landed in one pass)

The full v1 surface is built and green (tsc clean, 14/14 tests). Items I need from the
human before this can run against real services (the §10 "stop the human" list):

1. **Supabase project** — confirm a fresh project, then provide `EXPO_PUBLIC_SUPABASE_URL`
   and the anon key for `.env`. (Schema + RLS are ready in `supabase/migrations/0001_init.sql`.)
2. **`ANTHROPIC_API_KEY`** — confirm you'll add it to Supabase **secrets** (not `.env`,
   never pasted to me): `supabase secrets set ANTHROPIC_API_KEY=...`.
3. **Amazon Associates tag** — for `EXPO_PUBLIC_AMAZON_ASSOCIATE_TAG` (Buy on Amazon links).
4. **Apple bundle id / Team ID** — placeholder is `com.mosey.app`; suggest
   `com.hoffermarketing.mosey`. Confirm and I'll switch it.
5. **`mosey-concept-v3.html`** — not provided this session. I built design to the §8 tokens;
   share the HTML and the Design agent will reconcile any fidelity gaps.

Idea digest (full list in `IDEAS.md`) — candidates I'd promote first: a calm **trip-readiness
ring** on the active card, and **offline-first packing check-off**. Neither is built yet.

## Phase 1 — Scaffold & foundation

- **2026-06-29 — Backend delegated to a subagent.** SQL schema + RLS + 3 Edge Functions were
  built by a worker against `src/types/db.ts` and `CLAUDE.md`, then audited: guardrail text
  injected verbatim in all 3 prompts, ownership checks present, models pinned, RLS on all 8
  tables, no key in client. A shared `guardrails.ts` keeps the "no real places" wording
  byte-identical across prompts.
- **2026-06-29 — Trip detail uses an in-screen segmented control** (Timeline / Packing /
  Getting there) rather than a nested tab navigator — fewer moving parts, and the trip header
  + Ask Mosey sparkle stay shared across panels.
- **2026-06-29 — Timeline is deterministic, notifications are local.** `src/data/timeline.ts`
  generates events from start_date + transit_mode + trip shape (passport ~12wk, packing ~10d,
  download ~3d, day-of). Local notifications scheduled on trip creation. More reliable than the
  model for dates; unit-tested.
- **2026-06-29 — Packing/timeline/transit check-offs are optimistic** (TanStack Query
  onMutate) so they feel instant; rollback on error.
- **2026-06-29 — `.npmrc` pins `legacy-peer-deps=true`.** expo-router pulls an optional
  `react-native-worklets` whose peer range conflicts in the tree; this makes a fresh clone
  install cleanly. Added `@react-native-community/datetimepicker` for the questionnaire,
  `@expo/vector-icons` for iconography, and jest/jest-expo + babel-preset-expo for tests.
- **2026-06-29 — `tsconfig` sets `types: ["jest","node"]`** so the test files typecheck under
  the Expo base config (bundler module resolution wasn't auto-loading ambient @types).
- **2026-06-29 — `api.expo.dev` / `reactnative.directory` are blocked by egress policy**, so
  `expo install` can't resolve versions. Pinned SDK-native versions came from
  `expo/bundledNativeModules.json` and were installed directly via npm.

## Phase 1 — Scaffold & foundation (initial)

- **2026-06-29 — Expo SDK 56 / RN 0.85 / React 19 via `create-expo-app` blank-typescript.**
  Latest stable Expo at scaffold time. Started from the minimal blank-typescript
  template (not the tabs demo) to avoid boilerplate cruft, then layered Expo Router
  on top for a clean, intentional structure.
- **2026-06-29 — Expo Router (file-based) for navigation.** Required by the brief
  (§2). Structure: `(auth)` group for sign-in, `(app)` group for the authed
  experience, trip detail as a nested route with its own tab layout.
- **2026-06-29 — State/data: TanStack Query + Supabase JS client.** Query gives us
  caching, loading/error states, and optimistic updates for check-offs with little
  code. Auth/session via a lightweight React context over `supabase.auth`.
- **2026-06-29 — Bundle id placeholder `com.mosey.app`.** Per §10 we must confirm the
  real Apple Team ID + bundle id with the human. Using a sensible placeholder so the
  config is valid; flagged at the phase boundary. (Suggested: `com.hoffermarketing.mosey`.)
- **2026-06-29 — Secrets via env, not committed.** Client reads only
  `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Edge Functions read
  `ANTHROPIC_API_KEY` from Supabase secrets. `.env` is gitignored; `.env.example`
  documents the shape with no real values.
- **2026-06-29 — Fonts: Bricolage Grotesque (display) + Hanken Grotesk (UI) via
  `@expo-google-fonts`.** Matches §8 type spec without bundling raw font files.
- **2026-06-29 — Design fidelity reviewed against §8 tokens only.** `mosey-concept-v3.html`
  was not provided in this session; the §8 palette/type/signature spec is fully
  specified, so `src/theme/` encodes it as the interim source of truth. Flagged to
  request the HTML at the phase boundary.
