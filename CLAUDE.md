# Mosey — Global Guardrails (read me first)

Mosey is a **personal AI agent for family travel**, for parents with young kids.
iOS app (Expo / React Native). It plans around how families actually travel —
kids' ages, nap times, bedtime, max drive per day, laundry access — then keeps
the trip working while you're on it.

**V2 (current):** built from `MOSEY_BUILD_BRIEF.md` + the mockups in
`design/v2-mockups/`. V1 (the warm cream prototype) lives in git history before
2026-10-13; its best features (co-parent sharing, action-taking Ask Mosey,
nurture prompts) are planned carry-overs — see FUTURE.md.

Every subagent inherits this file. These rules are **non-negotiable**.

## Hard lines (NEVER cross)

1. **The Anthropic API key NEVER touches the client.** All Claude calls go through
   Supabase Edge Functions that hold the key as a secret. If `ANTHROPIC_API_KEY`
   ever appears in app code, a bundled `.env`, or anything shipped to the device —
   **stop and re-route.** The client only ever calls our Edge Functions.
2. **No invented facts (critical).** The AI must **never invent prices, hours,
   availability, addresses, or place facts**. Real-world content (stays,
   activities, events) comes ONLY from a real data source — partner APIs
   (Booking.com, Viator, Ticketmaster) or static mock data during phases 1–2 —
   and is labeled with its source. If a tool can't answer, Mosey says
   "check on [partner]". A wrong packing item is harmless; a fabricated price,
   opening time, or venue destroys trust.
3. **Replans are proposals.** `replan` (Meltdown / Raining / Hungry / Late)
   returns a proposal card; the user applies it with an explicit tap
   ("Update my day"). **Never auto-apply changes to a family's day.**
4. **Protect nap and bedtime blocks** in every generated or edited plan unless
   the parent explicitly overrides them.

## Other constraints

5. **Every suggestion carries a one-line "why"** in plain parent language
   (e.g. "Indoor anchor for a rainy morning; stroller-friendly loop").
6. **Strict-JSON AI output** from Edge Functions. Parse defensively, validate the
   shape, fall back sanely. **Never crash a screen on a bad AI response.**
7. **Bookings link OUT to partners** (affiliate). No in-app payments. Build deep
   links server-side (affiliate IDs live in env vars). Never imply an in-app
   purchase or "added to cart".
8. **Everything belongs to a trip / family.** No floating data.
9. **Secrets** live in Supabase secrets / env config, never committed. The client
   uses only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
10. **RLS on every table**, scoped by `family_id` → `families.owner_id = auth.uid()`
    (plus the sharing model when it carries over from v1).
11. **Kid-fit score** = age fit + duration vs. attention span + distance +
    facilities (restrooms, stroller, shade). The formula lives in code and is
    documented where it's computed.

## Tech stack (use exactly this)

- App: Expo + React Native (TypeScript), Expo Router. TanStack Query for server
  data, Zustand for local UI state.
- Backend/DB/Auth: Supabase (Postgres + Auth + Storage + Edge Functions).
- AI: Anthropic API via Edge Functions only; the `agent` function runs a Claude
  tool-use loop over our own tools (brief §6).
- Maps: `react-native-maps` (phase 5+); turn-by-turn via `Linking.openURL` deep
  links (brief §7).
- Notifications: Expo Notifications (local fine for now).

## Design source of truth

`design/v2-mockups/*.dc.html` + `MOSEY_BUILD_BRIEF.md` §3 tokens (in
`src/theme/tokens.ts`): ink `#0F2237`, ground `#F3F6FA`, coral CTA `#C9472B`,
teal `#0B7A6E`, sun `#FFC845`; Sora display + Figtree body; touch targets ≥44px;
phone frame reference 390×844. Match the mockups — don't improvise new colors.

## Working agreements

- Decide execution-level questions yourself; log meaningful choices to `DECISIONS.md`.
- Log ideas to `IDEAS.md`; deferred-but-good ideas to `FUTURE.md`. Don't silently
  build un-approved ideas; don't silently drop them.
- Definition-of-done gate for every feature: built → **QA** → **Design** →
  **Customer** → **Skeptic** sign-off. See `.claude/agents/` / AGENTS.md.
- Phase order comes from `MOSEY_BUILD_BRIEF.md` §8. Phases 1–2 are static screens
  with mock data: **no API calls, no schema changes** — the v1 Supabase project
  keeps running untouched until phase 3 lands.

## Expo version note

Expo SDK 56 / React Native 0.85 / React 19. Read the exact versioned docs at
https://docs.expo.dev/versions/v56.0.0/ before writing native-touching code.
