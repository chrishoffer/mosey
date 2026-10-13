import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, T, Wordmark } from '../src/components/ui';
import { useSession } from '../src/store/session';
import { colors, fonts, radius, spacing } from '../src/theme/tokens';

/**
 * Welcome + sign-up. PREVIEW auth: continuing creates a local session so the
 * whole app works; phase 3 swaps this for Supabase (Sign in with Apple + email).
 */
export default function WelcomeScreen() {
  const signIn = useSession((s) => s.signIn);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);

  function submit() {
    if (!email.includes('@')) {
      setErr('Enter a real email so your trips can follow you.');
      return;
    }
    signIn(email, name);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.ink }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Wordmark size={44} />
          <T variant="display" color={colors.white} style={styles.heroLine}>
            The trip, planned around{' '}
            <T variant="display" color={colors.sun}>
              your crew
            </T>
            .
          </T>
          <T variant="body" color="rgba(255,255,255,0.85)">
            Kids’ ages, nap windows, bedtime, max drive — Mosey plans with them, then keeps the trip
            working while you’re on it.
          </T>
          <View style={styles.points}>
            {[
              'Stays & activities ranked by Kid-fit',
              'A day plan that protects naps',
              'Packing that learns your family',
            ].map((p) => (
              <View key={p} style={styles.pointRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.sun} />
                <T variant="bodySemi" color={colors.white}>
                  {p}
                </T>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <T variant="title">Set up your crew</T>
          <TextInput
            style={styles.input}
            placeholder="Family name — e.g. Hoffer crew (optional)"
            placeholderTextColor={colors.faint}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setErr(null);
            }}
          />
          {err ? (
            <T variant="caption" color={colors.warn}>
              {err}
            </T>
          ) : null}
          <Button label="Start planning free" onPress={submit} />
          <View style={styles.appleBtn}>
            <Ionicons name="logo-apple" size={18} color={colors.faint} />
            <T variant="bodySemi" color={colors.faint}>
              Sign in with Apple — arrives with the App Store build
            </T>
          </View>
          <T variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>
            Preview build: your account lives on this phone for now. Free plan — one trip, no card.
          </T>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'flex-end' },
  hero: { padding: spacing.xxl, paddingTop: 84, gap: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  heroLine: { fontSize: 36, lineHeight: 42 },
  points: { gap: spacing.md, marginTop: spacing.sm },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xxl,
    paddingBottom: 40,
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.ground,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    minHeight: 50,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.ink,
  },
  appleBtn: {
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
