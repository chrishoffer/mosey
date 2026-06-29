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

export const accents: Record<AccentKey, AccentColor> = {
  sea: {
    key: 'sea',
    label: 'Sea',
    base: '#179B92',
    tint: '#D7F0ED',
    tintSoft: '#EAF7F5',
    deep: '#0C5E58',
    gradient: ['#1FB3A8', '#0F7D75'],
    onAccent: '#FFFFFF',
  },
  coral: {
    key: 'coral',
    label: 'Coral',
    base: '#F0663F',
    tint: '#FBDDD2',
    tintSoft: '#FCEDE7',
    deep: '#9B3415',
    gradient: ['#F58460', '#DB4E29'],
    onAccent: '#FFFFFF',
  },
  marigold: {
    key: 'marigold',
    label: 'Marigold',
    base: '#E9A732',
    tint: '#F9E9C5',
    tintSoft: '#FBF2DD',
    deep: '#8A5C0A',
    gradient: ['#F2BC54', '#D88E16'],
    onAccent: '#3A2A06',
  },
  grape: {
    key: 'grape',
    label: 'Grape',
    base: '#7A6CB8',
    tint: '#E2DCF1',
    tintSoft: '#EFEBF8',
    deep: '#473A7E',
    gradient: ['#8C7DCB', '#63549E',],
    onAccent: '#FFFFFF',
  },
  sky: {
    key: 'sky',
    label: 'Sky',
    base: '#4C92C9',
    tint: '#D7E8F5',
    tintSoft: '#EAF3FA',
    deep: '#235C8C',
    gradient: ['#5EA3D8', '#3577B0'],
    onAccent: '#FFFFFF',
  },
  sage: {
    key: 'sage',
    label: 'Sage',
    base: '#5E9B7E',
    tint: '#DCEDE3',
    tintSoft: '#EBF5EF',
    deep: '#2F5E47',
    gradient: ['#71AE90', '#4A8268'],
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
  hero: {
    shadowColor: '#1B2138',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  soft: {
    shadowColor: '#1B2138',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
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
