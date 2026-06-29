import { supabase } from './supabase';

/**
 * Thin client wrapper for AI features. The client NEVER calls Anthropic directly —
 * it invokes our Supabase Edge Functions, which hold the key as a secret
 * (CLAUDE.md guardrail #1). Each function reads/writes the trip's rows server-side
 * and returns a small status payload; the screens then re-fetch from Postgres.
 */

export interface EdgeResult<T = unknown> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

async function invoke<T>(fn: string, body: Record<string, unknown>): Promise<EdgeResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke<T>(fn, { body });
    if (error) {
      // Surface the Edge Function's own error message when it returns a non-2xx
      // body, instead of the generic "non-2xx status code".
      let message = error.message;
      const ctx = (error as { context?: { json?: () => Promise<unknown> } }).context;
      if (ctx?.json) {
        try {
          const parsed = (await ctx.json()) as { error?: string } | null;
          if (parsed?.error) message = parsed.error;
        } catch {
          /* keep the generic message */
        }
      }
      return { ok: false, data: null, error: message };
    }
    return { ok: true, data: data ?? null, error: null };
  } catch (e) {
    return { ok: false, data: null, error: e instanceof Error ? e.message : 'Network error' };
  }
}

export function generatePackingList(tripId: string) {
  return invoke<{ created: number }>('generate-packing-list', { trip_id: tripId });
}

export function generateTransitKit(tripId: string) {
  return invoke<{ created: number }>('generate-transit-kit', { trip_id: tripId });
}

export function generateDayPlan(tripId: string) {
  return invoke<{ created: number }>('generate-day-plan', { trip_id: tripId });
}

export interface AskMoseyReply {
  /** Plain, generic guidance — never names a real place (guardrail #2). */
  answer: string;
  /** Optional structured suggestions the UI can render as chips/actions. */
  suggestions?: string[];
  /** True when the question wanted a specific real place we can't answer yet. */
  deferred?: boolean;
}

export function askMosey(tripId: string, question: string) {
  return invoke<AskMoseyReply>('ask-mosey', { trip_id: tripId, question });
}
