# Mosey

**Put the trip down. Mosey holds the whole timeline and taps you at the right moment.**

A family-travel sidekick for parents — iOS app (Expo / React Native + Supabase + Claude).
This is a robust v1: a parent can sign in, save their kids once, plan multiple trips, get
an AI packing list and getting-there kit tailored to those kids and that trip, check items
off, follow a timeline of proactive nudges, use a bounded **Ask Mosey** assistant, and leave
a post-trip note that makes the next trip smarter.

> Amazon Associates ("Buy on Amazon") is **deferred for v1** — the module is kept dormant and
> reversible (see `FUTURE.md`).

## Guardrails (non-negotiable — see [CLAUDE.md](./CLAUDE.md))

1. **The Anthropic API key never touches the client.** All Claude calls go through Supabase
   Edge Functions that hold the key as a secret.
2. **No AI-named real places in v1.** AI generates packing, transit kits, and *generic*
   planning guidance only — never a named restaurant, beach, tour, or venue. A wrong packing
   item is harmless; a fake place destroys trust.

## Stack

- **App:** Expo SDK 56 + React Native 0.85 (TypeScript), Expo Router, TanStack Query.
- **Backend:** Supabase (Postgres + Auth + Edge Functions). RLS on every table.
- **AI:** Anthropic (`claude-sonnet-4-6` generation, `claude-haiku-4-5` reserved for cheap
  calls) — only from Edge Functions.
- **Subscriptions:** RevenueCat scaffold (stubbed paywall; v1 is free).
- **Affiliate:** Amazon Associates — deferred for v1 (dormant module retained).
- **Notifications:** Expo local notifications, driven by a deterministic timeline generator.

## Project layout

```
app/                     Expo Router routes
  (auth)/sign-in         Email auth
  (app)/                 Tabs: Shelf · Ask Mosey · Family
    index                Shelf home (color-blocked trip cards)
    new-trip             Quick questionnaire → trip
    ask                  Ask Mosey (bounded assistant)
    settings             Family profile + Mosey Plus
    paywall              Stubbed RevenueCat paywall
    trip/[id]/index      Trip detail: Timeline / Packing / Getting there
    trip/[id]/post-trip  Post-trip hits & misses (memory loop)
src/
  theme/                 §8 design tokens + type system
  components/            UI primitives, TripCard, Sparkle, DateField
  features/trip/         Timeline spine, Packing, Getting-there panels
  data/                  api.ts (Supabase access) + timeline.ts (deterministic generator)
  lib/                   supabase, auth, ai (edge wrappers), amazon, notifications, purchases
  types/db.ts            Domain types — source of truth, mirrored by the SQL schema
supabase/
  migrations/0001_init.sql   Schema + RLS + new-user trigger
  functions/                 generate-packing-list · generate-transit-kit · ask-mosey
```

## Getting started

```bash
npm install                 # legacy-peer-deps is pinned via .npmrc
cp .env.example .env         # fill in your Supabase project values + Amazon tag
npm run start                # Expo dev server
npm run typecheck            # tsc --noEmit
npm test                     # jest
```

### Backend setup

See [supabase/README.md](./supabase/README.md). In short:

```bash
supabase db push                                   # apply migrations + RLS
supabase secrets set ANTHROPIC_API_KEY=...          # the human adds this; never committed
supabase functions deploy generate-packing-list generate-transit-kit ask-mosey
```

## Process docs

- [DECISIONS.md](./DECISIONS.md) — execution-level choices made along the way.
- [IDEAS.md](./IDEAS.md) — proposals awaiting promotion into scope.
- [FUTURE.md](./FUTURE.md) — deliberately out-of-scope for v1.
- [.claude/agents/](./.claude/agents/) — the review team (Researcher, Design, QA, Skeptic,
  Customer) and the definition-of-done gate.
