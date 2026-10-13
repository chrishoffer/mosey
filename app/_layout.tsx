import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { Wordmark, T } from '../src/components/ui';
import { useSession } from '../src/store/session';
import { colors } from '../src/theme/tokens';

/** Branded load screen: ink field, the wordmark, one calm line. */
function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <Wordmark size={40} />
      <T variant="caption" color="rgba(255,255,255,0.75)">
        Plans the trip around your crew.
      </T>
      <ActivityIndicator color={colors.sun} style={{ marginTop: 10 }} />
    </View>
  );
}

/** Signed out → welcome. Signed in → keep out of welcome. */
function AuthGate() {
  const { signedIn, hydrated } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    const onWelcome = segments[0] === 'welcome';
    if (!signedIn && !onWelcome) router.replace('/welcome');
    if (signedIn && onWelcome) router.replace('/');
  }, [signedIn, hydrated, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ground },
      }}
    >
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });
  const hydrated = useSession((s) => s.hydrated);

  if (!fontsLoaded || !hydrated) {
    // Fonts may not be ready, so the load screen leans on the wordmark's system
    // fallback for a frame or two — acceptable; it's on brand ink either way.
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthGate />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
