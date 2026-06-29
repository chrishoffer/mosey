import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Screen, Text } from '../../src/components/ui';
import { Logo } from '../../src/components/Logo';
import { useAuth } from '../../src/lib/auth';
import { palette, radius, spacing } from '../../src/theme/tokens';

export default function SignIn() {
  const { signInWithEmail, signUpWithEmail, configured } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!email.includes('@') || password.length < 6) {
      setError('Enter a valid email and a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    const fn = mode === 'in' ? signInWithEmail : signUpWithEmail;
    const { error: err } = await fn(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace('/(app)');
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <View style={styles.brand}>
            <Logo size={56} />
            <Text variant="hero" style={styles.title}>
              Mosey
            </Text>
            <Text variant="body" color={palette.inkSoft} style={styles.tagline}>
              Put the trip down. Mosey holds the timeline and taps you at the right moment.
            </Text>
          </View>

          {!configured && (
            <View style={styles.warn}>
              <Text variant="caption" color={palette.danger}>
                Supabase isn’t configured yet. Add EXPO_PUBLIC_SUPABASE_URL and ANON_KEY to .env to
                enable sign-in.
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={palette.inkSoft}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={palette.inkSoft}
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
            />
            {error && (
              <Text variant="caption" color={palette.danger}>
                {error}
              </Text>
            )}
            <Button
              label={mode === 'in' ? 'Sign in' : 'Create account'}
              onPress={submit}
              loading={busy}
              disabled={!configured}
            />
            <Button
              label={mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
              variant="ghost"
              onPress={() => {
                setMode((m) => (m === 'in' ? 'up' : 'in'));
                setError(null);
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.x2 },
  brand: { alignItems: 'center', gap: spacing.sm },
  title: { marginTop: spacing.sm },
  tagline: { textAlign: 'center', maxWidth: 320 },
  form: { gap: spacing.md },
  input: {
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 16,
    color: palette.ink,
    minHeight: 52,
  },
  warn: {
    backgroundColor: '#FBE7E2',
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
