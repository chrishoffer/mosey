# Mosey — Supabase Backend

Postgres schema + RLS, and three Edge Functions that hold the Anthropic key as a
secret. The iOS client only ever calls these functions (never Anthropic directly).

## Layout

```
supabase/
  config.toml                 # project_id = "mosey"
  migrations/0001_init.sql     # all tables, RLS, handle_new_user() trigger
  functions/
    deno.json                  # import map (@supabase/supabase-js, std)
    _shared/                    # cors, anthropic client, admin client, guardrails
    generate-packing-list/
    generate-transit-kit/
    ask-mosey/
```

## 1. Push the schema

```bash
supabase db push
```

This creates every table with RLS enabled and owner-scoped policies, plus the
`handle_new_user()` trigger that auto-creates a `profiles` row on signup.

## 2. Set secrets (the human does this — we never paste the key)

The Anthropic API key is read ONLY inside Edge Functions, from
`Deno.env.get('ANTHROPIC_API_KEY')`. It never touches the client.

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

> You (the human) must add `ANTHROPIC_API_KEY` to Supabase secrets. It is never
> committed and never pasted into app code or any `.env` shipped to the device.

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected
into the function runtime by Supabase automatically — no need to set them.

## 3. Deploy the functions

```bash
supabase functions deploy generate-packing-list
supabase functions deploy generate-transit-kit
supabase functions deploy ask-mosey
```

## Function contracts

| Function                | Body                      | Returns                                   |
| ----------------------- | ------------------------- | ----------------------------------------- |
| `generate-packing-list` | `{ trip_id }`             | `{ created: number }`                     |
| `generate-transit-kit`  | `{ trip_id }`             | `{ created: number }`                     |
| `ask-mosey`             | `{ trip_id, question }`   | `{ answer, suggestions?, deferred? }`     |

Each function: verifies the caller owns `trip_id`, calls `claude-sonnet-4-6` with
a strict-JSON prompt that **forbids naming any real place**, parses defensively,
and falls back to a sane generic set rather than crashing.

## Guardrails enforced here

- The Anthropic key lives only in Edge Function env — never on the client.
- Every generation prompt forbids naming real places/restaurants/venues.
- Strict-JSON output, parsed defensively with a fallback on failure.
- RLS on every table; users only ever touch rows tied to their own `auth.uid()`.
