import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, T, Wordmark } from '../src/components/ui';
import { PLANS, type PlanId } from '../src/config/plans';
import { useEntitlements } from '../src/store/entitlements';
import { colors, radius, spacing } from '../src/theme/tokens';

/**
 * Paywall — the three tiers Chris specced. PREVIEW billing: choosing a plan sets
 * the local entitlement so every gate behaves like production. RevenueCat
 * replaces the button handlers later; copy and layout stay.
 */
export default function PaywallScreen() {
  const router = useRouter();
  const { plan, setPlan } = useEntitlements();

  function choose(id: PlanId) {
    setPlan(id);
    router.back();
  }

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Wordmark size={24} onDark={false} />
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.close} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>
        <T variant="display" style={{ marginTop: 6 }}>
          Let Mosey hold the whole trip.
        </T>
        <T variant="body" color={colors.muted} style={{ marginTop: 6 }}>
          Start free. Upgrade when you want the in-trip agent, learning packing lists, and both
          parents editing together.
        </T>

        {PLANS.map((p) => {
          const current = plan === p.id;
          return (
            <Card
              key={p.id}
              style={[styles.planCard, p.highlight && styles.highlight]}
            >
              {p.highlight && (
                <View style={styles.bestBadge}>
                  <T variant="caption" color={colors.ink} style={{ fontSize: 12 }}>
                    Best for most families
                  </T>
                </View>
              )}
              <View style={styles.planHead}>
                <T variant="title">{p.name}</T>
                <View style={{ alignItems: 'flex-end' }}>
                  <T variant="title" color={p.highlight ? colors.teal : colors.ink}>
                    {p.price}
                  </T>
                  {p.priceNote ? <T variant="caption">{p.priceNote}</T> : null}
                </View>
              </View>
              <T variant="caption" style={{ marginTop: 2 }}>
                {p.tagline}
              </T>
              <View style={styles.features}>
                {p.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="checkmark" size={16} color={colors.teal} />
                    <T variant="body" style={{ flex: 1 }}>
                      {f}
                    </T>
                  </View>
                ))}
              </View>
              {current ? (
                <View style={styles.currentPill}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.teal} />
                  <T variant="bodySemi" color={colors.teal}>
                    Your current plan
                  </T>
                </View>
              ) : (
                <Button
                  label={p.id === 'free' ? 'Switch to Free' : `Choose ${p.name}`}
                  kind={p.highlight ? 'primary' : 'ink'}
                  onPress={() => choose(p.id)}
                />
              )}
            </Card>
          );
        })}

        <T variant="caption" color={colors.faint} style={styles.previewNote}>
          Preview build: no card, no charge — choosing a plan just unlocks it on this phone so you
          can feel the difference. Real billing arrives with the App Store build.
        </T>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.ground },
  content: { padding: spacing.xl, paddingBottom: 48, gap: spacing.lg },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCard: { padding: spacing.xl, gap: spacing.md, overflow: 'visible' },
  highlight: { borderWidth: 2, borderColor: colors.teal },
  bestBadge: {
    position: 'absolute',
    top: -12,
    left: spacing.xl,
    backgroundColor: colors.sun,
    borderRadius: radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  features: { gap: spacing.sm },
  featureRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  currentPill: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: radius.button,
    backgroundColor: colors.tealSoft,
  },
  previewNote: { textAlign: 'center', paddingHorizontal: spacing.lg },
});
