import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HIT_TARGET, palette, radius, shadow, spacing } from '../theme/tokens';
import { type as typeStyles } from '../theme/typography';

type Variant = keyof typeof typeStyles;

export function Text({
  variant = 'body',
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: string }) {
  return (
    <RNText
      {...rest}
      style={[typeStyles[variant], color ? { color } : null, style]}
      allowFontScaling
    />
  );
}

export function Screen({
  children,
  style,
  edges = ['top'],
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  lift = 'soft',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  lift?: 'hero' | 'soft' | 'none';
}) {
  return <View style={[styles.card, shadow[lift], style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
  ...rest
}: PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const isDisabled = disabled || loading;
  const palettes = {
    primary: { bg: palette.coral, fg: palette.white, border: 'transparent' },
    secondary: { bg: palette.card, fg: palette.ink, border: palette.line },
    ghost: { bg: 'transparent', fg: palette.coral, border: 'transparent' },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palettes.bg,
          borderColor: palettes.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palettes.fg} />
      ) : (
        <View style={styles.buttonInner}>
          {icon}
          <RNText style={[typeStyles.bodyStrong, { color: palettes.fg }]}>{label}</RNText>
        </View>
      )}
    </Pressable>
  );
}

export function Pill({
  label,
  active,
  onPress,
  tint,
  fg,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tint?: string;
  fg?: string;
}) {
  const bg = active ? tint ?? palette.ink : palette.card;
  const text = active ? fg ?? palette.white : palette.inkSoft;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[styles.pill, { backgroundColor: bg, borderColor: active ? 'transparent' : palette.line }]}
    >
      <RNText style={[typeStyles.label, { color: text }]}>{label}</RNText>
    </Pressable>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      style={styles.progressTrack}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(pct * 100), min: 0, max: 100 }}
    >
      <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color ?? palette.coral }]} />
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function ScreenPadding({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={{ paddingBottom: insets.bottom + spacing.lg }}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  button: {
    minHeight: HIT_TARGET,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pill: {
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.line,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  divider: {
    height: 1,
    backgroundColor: palette.line,
    marginVertical: spacing.md,
  },
});
