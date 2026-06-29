import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Screen, Text } from '../../src/components/ui';
import { Sparkle } from '../../src/components/Sparkle';
import { getPlusFeatures, purchasePlus } from '../../src/lib/purchases';
import { palette, radius, spacing } from '../../src/theme/tokens';

/** Stubbed paywall (§7.9). Informational in v1 — Mosey is free. The scaffold is
 *  here so RevenueCat can drop in without reworking the UI. */
export default function Paywall() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
          <Ionicons name="close" size={26} color={palette.ink} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Sparkle size={40} />
          <Text variant="hero" style={{ marginTop: spacing.sm }}>
            Mosey Plus
          </Text>
          <Text variant="body" color={palette.inkSoft} style={{ textAlign: 'center', marginTop: spacing.xs }}>
            Free while we’re in v1. Here’s what your family gets.
          </Text>
        </View>

        <Card lift="soft">
          {getPlusFeatures().map((f) => (
            <View key={f} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={palette.coral} />
              <Text variant="body" style={{ flex: 1 }}>
                {f}
              </Text>
            </View>
          ))}
        </Card>

        {msg ? (
          <Card lift="none" style={{ backgroundColor: palette.card }}>
            <Text variant="body" color={palette.inkSoft}>
              {msg}
            </Text>
          </Card>
        ) : null}

        <Button
          label="Continue — it’s on us"
          onPress={async () => {
            const res = await purchasePlus();
            setMsg(res.message);
          }}
        />
        <Text variant="caption" color={palette.inkSoft} style={{ textAlign: 'center' }}>
          No charge in v1. Subscriptions arrive in a later update.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 },
  hero: { alignItems: 'center' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
});
