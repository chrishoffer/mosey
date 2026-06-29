import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import { View } from 'react-native';
import { queryClient } from '../src/lib/queryClient';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { AccountProvider } from '../src/lib/account';
import { palette } from '../src/theme/tokens';

/** Redirects between the (auth) and (app) route groups based on session. */
function AuthGate() {
  const { session, loading, configured } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    // When Supabase isn't configured yet we still let the user reach the app shell,
    // where each screen shows a friendly "connect Supabase" state.
    const signedIn = !!session || !configured;
    if (!signedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (signedIn && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [session, loading, configured, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.paper } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_800ExtraBold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  // We don't hard-block on fonts — if they fail we fall back to system fonts so the
  // app never hangs on a blank splash. A one-frame paper background while loading.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: palette.paper }} />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AccountProvider>
            <StatusBar style="dark" />
            <AuthGate />
          </AccountProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
