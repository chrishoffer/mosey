import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { colors, fonts, MIN_TOUCH, radius, spacing } from '../theme/tokens';

/* Shared UI kit for Mosey v2. Match the mockups in design/v2-mockups/:
   - dark ink headers with 28px rounded bottom corners
   - "mosey." wordmark: Sora 700 with a sun-colored dot
   - pill chips (999), white cards (16), uppercase section labels
   - coral primary buttons, teal for success/"kid-fit"/directions          */

type TVariant = 'display' | 'title' | 'heading' | 'body' | 'bodySemi' | 'bodyBold' | 'caption' | 'label' | 'section';

const T_STYLES: Record<TVariant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 36, letterSpacing: -0.8, color: colors.ink },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 27, letterSpacing: -0.4, color: colors.ink },
  heading: { fontFamily: fonts.displaySemi, fontSize: 17, lineHeight: 22, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.ink },
  bodySemi: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 21, color: colors.ink },
  bodyBold: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 21, color: colors.ink },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 19, color: colors.ink },
  section: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    lineHeight: 17,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: colors.muted,
  },
};

export function T({
  variant = 'body',
  color,
  style,
  children,
  ...rest
}: {
  variant?: TVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
} & React.ComponentProps<typeof RNText>) {
  return (
    <RNText {...rest} style={[T_STYLES[variant], color ? { color } : null, style]}>
      {children}
    </RNText>
  );
}

/** The "mosey." wordmark — Sora bold with the sun dot. */
export function Wordmark({ size = 20, onDark = true }: { size?: number; onDark?: boolean }) {
  return (
    <RNText style={{ fontFamily: fonts.display, fontSize: size, color: onDark ? colors.white : colors.ink }}>
      mosey<RNText style={{ color: colors.sun }}>.</RNText>
    </RNText>
  );
}

/** Root screen container on the app ground color. */
export function Screen({
  children,
  style,
  edges = ['top'],
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
}) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

/** Dark ink hero header with the 28px rounded bottom, as on Trip home / search.
 *  Absorbs the top safe-area inset itself so the notch area stays ink — pair it
 *  with a Screen that passes edges={[]}. */
export function InkHeader({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.inkHeader, { paddingTop: insets.top + spacing.xl + 2 }, style]}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <T variant="section">{children}</T>
    </View>
  );
}

/** Pill chip. Selected = ink on light surfaces, sun on dark surfaces. */
export function Chip({
  label,
  selected = false,
  onDark = false,
  onPress,
  icon,
  style,
}: {
  label: string;
  selected?: boolean;
  onDark?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = selected
    ? onDark
      ? colors.sun
      : colors.ink
    : onDark
      ? 'rgba(255,255,255,0.14)'
      : colors.card;
  const fg = selected ? (onDark ? colors.ink : colors.white) : onDark ? colors.white : colors.ink;
  const border = selected || onDark ? 'transparent' : colors.lineStrong;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected } : undefined}
      style={[styles.chip, { backgroundColor: bg, borderColor: border }, style]}
    >
      {icon}
      <RNText style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: fg }}>{label}</RNText>
    </Pressable>
  );
}

/** Primary (coral) / secondary (ink) / ghost buttons, >=44px tall. */
export function Button({
  label,
  kind = 'primary',
  onPress,
  style,
  textStyle,
  disabled,
  ...rest
}: {
  label: string;
  kind?: 'primary' | 'ink' | 'ghost' | 'teal';
  textStyle?: StyleProp<TextStyle>;
} & PressableProps & { style?: StyleProp<ViewStyle> }) {
  const bg =
    kind === 'primary' ? colors.coral : kind === 'ink' ? colors.ink : kind === 'teal' ? colors.teal : 'transparent';
  const fg = kind === 'ghost' ? colors.ink : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: pressed ? 0.92 : disabled ? 0.5 : 1 },
        kind === 'ghost' && { borderWidth: 1.5, borderColor: colors.lineStrong, backgroundColor: colors.card },
        style,
      ]}
    >
      <RNText style={[{ fontFamily: fonts.bodyBold, fontSize: 15, color: fg }, textStyle]}>{label}</RNText>
    </Pressable>
  );
}

/** Mosey's tip strip — sunSoft background, as in the mockups. */
export function TipStrip({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.tip, style]}>
      <RNText style={{ fontSize: 14 }}>💡</RNText>
      <T variant="caption" color={colors.ink} style={{ flex: 1 }}>
        {children}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  inkHeader: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + 2,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.chip,
    borderWidth: 1,
    minHeight: 36,
  },
  button: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.sunSoft,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
});
