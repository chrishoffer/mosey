/**
 * Mosey design tokens — source of truth derived from the build brief §8 and
 * (when provided) mosey-concept-v3.html. Warm, playful, calm. Each trip carries
 * a color. Keep all color/spacing/radius decisions here so the Design agent can
 * audit one place.
 */

export const palette = {
  ink: '#1B2138',
  inkSoft: '#6A6F86',
  paper: '#F6F1EA',
  card: '#FFFFFF',
  line: '#EBE4D9',
  coral: '#F0663F', // primary action
  // status / utility
  success: '#5E9B7E',
  danger: '#C2452E',
  white: '#FFFFFF',
} as const;

/** Per-trip color identity (the shelf signature). Each key carries a full set:
 *  base hue, a bold tint for card fills, a deeper same-hue text color, and a
 *  gradient pair for the active-trip hero card. */
export type AccentKey = 'sea' | 'coral' | 'marigold' | 'grape' | 'sky' | 'sage';

export interface AccentColor {
  key: AccentKey;
  label: string;
  base: string; // the signature hue
  tint: string; // bold card fill
  tintSoft: string; // softer fill for archived trips
  deep: string; // deeper same-hue text/headings on tint
  gradient: [string, string]; // rich gradient for the active hero card
  onAccent: string; // text color that sits on `base`/gradient
}

// Tint/deep values are taken directly from mosey-concept-v3.html so cards match
// the concept exactly. tintSoft is a lighter wash for archived ("in the books")
// cards; gradient runs base → deep for the active hero card (concept: 155deg).
export const accents: Record<AccentKey, AccentColor> = {
  sea: {
    key: 'sea',
    label: 'Sea',
    base: '#179B92',
    tint: '#D6EFEC',
    tintSoft: '#E9F6F4',
    deep: '#0C6A63',
    gradient: ['#179B92', '#0C6A63'],
    onAccent: '#FFFFFF',
  },
  coral: {
    key: 'coral',
    label: 'Coral',
    base: '#F0663F',
    tint: '#FBE3D9',
    tintSoft: '#FDF0EA',
    deep: '#B8431F',
    gradient: ['#F0663F', '#D84E26'],
    onAccent: '#FFFFFF',
  },
  marigold: {
    key: 'marigold',
    label: 'Marigold',
    base: '#E9A732',
    tint: '#FAEBCD',
    tintSoft: '#FCF4E2',
    deep: '#9C6B12',
    gradient: ['#EFB54E', '#D88E16'],
    onAccent: '#3A2A06',
  },
  grape: {
    key: 'grape',
    label: 'Grape',
    base: '#7A6CB8',
    tint: '#E6E1F2',
    tintSoft: '#F1EEF8',
    deep: '#4E4185',
    gradient: ['#7A6CB8', '#4E4185'],
    onAccent: '#FFFFFF',
  },
  sky: {
    key: 'sky',
    label: 'Sky',
    base: '#4C92C9',
    tint: '#DBEAF4',
    tintSoft: '#ECF3FA',
    deep: '#235E8D',
    gradient: ['#4C92C9', '#235E8D'],
    onAccent: '#FFFFFF',
  },
  sage: {
    key: 'sage',
    label: 'Sage',
    base: '#5E9B7E',
    tint: '#DCEEE3',
    tintSoft: '#ECF6F0',
    deep: '#356D52',
    gradient: ['#5E9B7E', '#356D52'],
    onAccent: '#FFFFFF',
  },
};

export const accentList = Object.values(accents);

export function getAccent(key: string | null | undefined): AccentColor {
  if (key && key in accents) return accents[key as AccentKey];
  return accents.sea;
}

/** Kid color-coding — distinct from trip accents so a child reads as a child
 *  regardless of which trip they're on. */
export const kidColors = [
  '#E8694A', // warm red
  '#3E8FB0', // steel blue
  '#C98A2B', // amber
  '#6B8E4E', // olive
  '#A65EA8', // orchid
  '#D06A8C', // rose
] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  x2: 32,
  x3: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

/** Floating-card lift — big soft shadows reserved for HERO elements only
 *  (active trip card, the live nudge, packing rows). Restraint keeps it calm. */
export const shadow = {
  // Matches the concept's --lift / --lift-sm: a big, soft, downward lift.
  hero: {
    shadowColor: '#1B2138',
    shadowOpacity: 0.3,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  soft: {
    shadowColor: '#1B2138',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
} as const;

/** Minimum interactive target — accessibility (§8). */
export const HIT_TARGET = 44;
