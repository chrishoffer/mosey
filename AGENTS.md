# Mosey — Agent guide

See **[CLAUDE.md](./CLAUDE.md)** for the full, non-negotiable guardrails. Every
agent (orchestrator and subagents) inherits those rules. The short version:

1. **Anthropic API key never touches the client** — all Claude calls go through a
   Supabase Edge Function.
2. **Never name a real place** (restaurant, beach, tour, venue) in v1 — generic
   guidance only.
3. Models: `claude-sonnet-4-6` (generation), `claude-haiku-4-5` (cheap/frequent).
4. Strict-JSON AI output, parse defensively, never crash a screen on bad AI output.
5. Everything belongs to a trip. RLS on every table. Secrets never committed.

## Expo HAS CHANGED

Expo SDK 56 / React Native 0.85 / React 19. Read the exact versioned docs at
https://docs.expo.dev/versions/v56.0.0/ before writing native-touching code.
