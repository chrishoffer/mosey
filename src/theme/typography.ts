/**
 * Type system (§8): Display = Bricolage Grotesque 800; UI/body = Hanken Grotesk.
 * Font family names match the @expo-google-fonts package exports; they are loaded
 * in app/_layout.tsx. If fonts fail to load we fall back to the system font, so
 * the app never blocks on type.
 */
import { TextStyle } from 'react-native';
import { palette } from './tokens';

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  body: 'HankenGrotesk_400Regular',
  bodyMedium: 'HankenGrotesk_500Medium',
  bodySemibold: 'HankenGrotesk_600SemiBold',
  bodyBold: 'HankenGrotesk_700Bold',
} as const;

/** Map used by app/_layout.tsx useFonts(). */
export const fontMap = {
  // imported lazily in _layout to keep this module side-effect free
};

type Variant =
  | 'hero'
  | 'title'
  | 'heading'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'overline';

export const type: Record<Variant, TextStyle> = {
  hero: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: palette.ink, letterSpacing: -0.5 },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: palette.ink, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: palette.ink, letterSpacing: -0.2 },
  subtitle: { fontFamily: fonts.bodySemibold, fontSize: 17, lineHeight: 22, color: palette.ink },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: palette.ink },
  bodyStrong: { fontFamily: fonts.bodySemibold, fontSize: 16, lineHeight: 23, color: palette.ink },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 18, color: palette.inkSoft },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 17, color: palette.inkSoft },
  overline: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    lineHeight: 14,
    color: palette.inkSoft,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
};
