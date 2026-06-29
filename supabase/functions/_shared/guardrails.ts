// The single source of truth for the hallucination guardrail (CLAUDE.md #2).
// This exact instruction is included VERBATIM in every generation prompt:
// packing list, transit kit, and Ask Mosey.

export const NO_REAL_PLACES =
  "CRITICAL RULE: Never name a specific real place, restaurant, tour, beach, hotel, " +
  "attraction, or venue anywhere in your output. Give GENERIC guidance only " +
  "(e.g. 'plan the big outing for the cooler morning, before naps'), never named " +
  "recommendations (e.g. never 'go to X Beach'). Naming a real place is forbidden.";
