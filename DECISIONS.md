# DECISIONS

Execution-level choices made autonomously. Newest first. Each: what + why.

## Post-build adjustments

- **2026-06-29 — Whole-account sharing with full edit (Chris chose 1b + 2a).** Migration
  `0004_sharing.sql` adds `account_members` (owner_id, member_id, invited_email, status) and a
  SECURITY DEFINER `can_access(owner)` used to re-point EVERY data policy: you can reach a row
  if you own the account or are an active member. `claim_invites()` RPC links a pending invite
  to the caller by matching their JWT email (so you can only ever claim invites sent to *your*
  address); only an owner can create invites (RLS `owner_id = auth.uid()`). Client: `AccountProvider`
  tracks the active account + a switcher (Trips header + Settings); account-scoped reads/writes
  (`fetchTrips`/`fetchChildren`/`createTrip`/`createChild`/profile) now key off the current account
  id; Settings sharing UI invites by email and lists pending/active members. No edge-function
  changes → migration + pull only, no redeploy. Non-shared path is unchanged (can_access(self)=true).
  Deferred to next: richer questionnaire feeding the AI. tsc clean, 20/20.


- **2026-06-29 — Round 3 device feedback (client-only, no DB/redeploy).** (1) **Add crew during
  setup** — new `CrewPicker` (saved chips + inline "Add someone") replaces the static chip list in
  new-trip. (2) **Edit crew on an existing trip** — a "Who's going" card on trip detail with the
  same picker, persisting via new `addTraveler`/`removeTraveler`. (3) **Ask FAB overlap fixed** —
  smaller, less-raised coral sparkle; label shortened to "Ask". (4) **Renamed tabs**: Shelf→Trips,
  Family→Settings. (5) **Delete any recommended item** — packing/transit/home rows all deletable
  now (added `deleteTransitItem`). (6) **Warmth pass** — trip-detail header is a colored band;
  AI empty-state cards use the trip's tint. (7) **Settings area** — added Notifications controls
  (permission status + enable) and a Sharing entry (scaffold; real sharing is the next focused
  task). Deferred to next round (they share a migration): real co-parent **trip sharing** and a
  **richer questionnaire** feeding the AI. tsc clean, 20/20.


- **2026-06-29 — Round 2: four substance features (all promoted by Chris).** (1) **Day-by-day
  flow plan** — new `generate-day-plan` Edge Function (sonnet, generic/no-places, pace+age
  aware), `trip_days` table, `DayPlanPanel`, a new "Days" tab. (2) **Trip-readiness ring** —
  `useReadiness` blends packing/timeline/getting-there/home progress; `ReadinessRing` (svg) shows
  on the trip-detail header and the active shelf card. (3) **Logistics pocket** — `logistics_items`
  table + CRUD in the new "Prep" tab. (4) **Leaving-home checklist** — `home_tasks` table, seeded
  with deterministic defaults on trip creation, check-off + custom adds, also in "Prep".
  Trip-detail segmented control is now horizontally scrollable (5 tabs). Requires migration
  `0003_days_logistics_home.sql` and a function redeploy (now four functions). tsc clean, 20/20.


- **2026-06-29 — Round 1 of device feedback (Chris).** (1) **Family = everyone**: `children`
  table now holds any traveler — added `relation` and made `birth_year` nullable (adults skip
  age); UI relabeled to "your crew"; AI prompts include relation and only state age when known;
  `hasKids` for the timeline is derived via `isKid()` (relation==='child' or age<18). Kept the
  table named `children` to avoid a risky rename on the live DB. (2) **Date picker rebuilt** —
  iOS bottom-sheet spinner + Done, Android native dialog, defaults to *today* (the old inline
  calendars overlapped in the scroll view and defaulted to a far-past year). (3) **Trip-color
  picker removed** from the questionnaire — accent is now auto-assigned silently. (4) **Transit
  modes expanded** to fly / drive / train / public_transit / mix; timeline download nudge now
  fires for train + public transit too. Requires migration `0002_crew_and_transit.sql` + a
  function redeploy. tsc clean, 20/20 tests.


- **2026-06-29 — Design pass aligned to `mosey-concept-v3.html` (now provided).** The human
  shared the concept. Applied: exact per-trip tint/deep shades + base→deep gradients and the
  stronger card lift (`--lift`/`--lift-sm`) into `src/theme/tokens.ts`; added the Mosey brand
  mark (sea hill + marigold sun) as `src/components/Logo.tsx` and put it on the shelf brand bar
  + sign-in; the playful **"Let's mosey."** greeting with a dynamic sub-line and concept section
  labels (Up next / Planning / In the books); and the center tab is now a raised coral sparkle
  FAB. The concept CSS is committed at `design/mosey-concept-v3.html` as the tracked reference.
  Per the human's note, treated as guidance, not gospel. tsc clean, 14/14 tests still pass.


- **2026-06-29 — Amazon Associates removed from v1 surface (human request).** Removed the
  "Buy on Amazon" button from the packing UI and dropped the associate tag from `.env.example`
  and the handoff asks. Kept `src/lib/amazon.ts` + test dormant for trivial re-enable; logged
  in `FUTURE.md`. No data-model change.

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
