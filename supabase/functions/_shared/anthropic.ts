// Tiny Anthropic client. The API key is read ONLY here, from the Edge Function's
// environment (Deno.env). It never touches the client and is never echoed back.
// (CLAUDE.md guardrail #1.)

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Pinned model IDs (CLAUDE.md guardrail #3). Exposed for callers; no aliases.
export const MODELS = {
  /** Real generation: packing, transit kit, planning guidance. */
  generation: "claude-sonnet-4-6",
  /** Cheap, simple, high-frequency calls. */
  cheap: "claude-haiku-4-5",
} as const;

export interface CallClaudeArgs {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
}

/**
 * POST a single-turn message to the Anthropic API and return the concatenated
 * text content. Throws if the key is missing or the API responds non-2xx — the
 * caller is expected to try/catch and fall back to a sane default set of rows.
 */
export async function callClaude(
  { model, system, user, maxTokens }: CallClaudeArgs,
): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    // Do NOT leak details; the caller turns this into a fallback path.
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    // Avoid echoing any header/key material; surface only status.
    throw new Error(`Anthropic API error: ${res.status}`);
  }

  const data = await res.json();
  // content is an array of blocks; concatenate the text blocks.
  const text = Array.isArray(data?.content)
    ? data.content
      .filter((b: { type?: string }) => b?.type === "text")
      .map((b: { text?: string }) => b?.text ?? "")
      .join("")
    : "";
  return text;
}

/**
 * Defensive JSON extraction. Strips optional ```json / ``` code fences and
 * surrounding prose, then JSON.parses. Returns null on any failure so callers
 * can fall back rather than crash.
 */
export function extractJson<T>(text: string): T | null {
  if (!text) return null;
  let s = text.trim();

  // Strip a fenced block if present: ```json ... ``` or ``` ... ```
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();

  // If there is still leading/trailing prose, grab the outermost JSON object/array.
  if (!(s.startsWith("{") || s.startsWith("["))) {
    const objStart = s.indexOf("{");
    const arrStart = s.indexOf("[");
    const start = [objStart, arrStart].filter((i) => i >= 0).sort((a, b) => a - b)[0];
    if (start === undefined) return null;
    const lastObj = s.lastIndexOf("}");
    const lastArr = s.lastIndexOf("]");
    const end = Math.max(lastObj, lastArr);
    if (end <= start) return null;
    s = s.slice(start, end + 1);
  }

  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
