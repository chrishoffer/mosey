// Mosey v2 design tokens — source of truth is MOSEY_BUILD_BRIEF.md §3 and the
// mockups in design/v2-mockups/. Match the mockups; don't improvise new colors.

export const colors = {
  ink: '#0F2237', // primary text, dark surfaces
  ground: '#F3F6FA', // app background
  card: '#FFFFFF',
  line: '#E3E9F1',
  lineStrong: '#DCE3EC',
  muted: '#4A5A6E', // secondary text
  faint: '#9FB0C4', // icons, empty checkboxes
  coral: '#C9472B', // primary CTA
  coralDeep: '#A93A22',
  teal: '#0B7A6E', // success, "kid-fit", directions
  tealSoft: '#E6F3F1',
  sun: '#FFC845', // highlight chips on dark
  sunSoft: '#FFF4D6', // Mosey's tips
  warn: '#A33A22', // carry-on / TSA warnings
  warnSoft: '#FBEAE5',
  white: '#FFFFFF',
} as const;

export const fonts = {
  display: 'Sora_700Bold',
  displaySemi: 'Sora_600SemiBold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
} as const;

export const radius = { chip: 999, card: 16, cardLg: 20, button: 14 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

/** Touch targets >= 44px (brief §3). Phone frame reference: 390 x 844. */
export const MIN_TOUCH = 44;
