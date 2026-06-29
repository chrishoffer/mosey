import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Screen, Text } from '../../../../src/components/ui';
import { Sparkle } from '../../../../src/components/Sparkle';
import { TimelinePanel } from '../../../../src/features/trip/TimelinePanel';
import { PackingPanel } from '../../../../src/features/trip/PackingPanel';
import { GettingTherePanel } from '../../../../src/features/trip/GettingTherePanel';
import { useTrip, useUpdateTrip } from '../../../../src/hooks';
import { getAccent, palette, radius, spacing } from '../../../../src/theme/tokens';
import { fmtDateRange } from '../../../../src/lib/dates';
import type { TripStatus } from '../../../../src/types/db';

type Tab = 'timeline' | 'packing' | 'transit';
const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'timeline', label: 'Timeline', icon: 'git-commit-outline' },
  { key: 'packing', label: 'Packing', icon: 'checkbox-outline' },
  { key: 'transit', label: 'Getting there', icon: 'airplane-outline' },
];

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const trip = useTrip(id);
  const updateTrip = useUpdateTrip();
  const [tab, setTab] = useState<Tab>('timeline');

  if (trip.isLoading) {
    return (
      <Screen>
        <Center text="Loading trip…" />
      </Screen>
    );
  }
  if (trip.isError || !trip.data) {
    return (
      <Screen>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
        </View>
        <Center text="This trip couldn’t be found." />
      </Screen>
    );
  }

  const t = trip.data;
  const accent = getAccent(t.accent_color);

  function setStatus(status: TripStatus) {
    updateTrip.mutate({ id: t.id, patch: { status } });
  }

  return (
    <Screen>
      <View style={[styles.header, { borderBottomColor: palette.line }]}>
        <BackButton onPress={() => router.back()} />
        <Pressable
          onPress={() => router.push({ pathname: '/(app)/ask', params: { trip: t.id } })}
          accessibilityRole="button"
          accessibilityLabel="Ask Mosey about this trip"
          style={[styles.sparkleBtn, { borderColor: accent.base }]}
          hitSlop={8}
        >
          <Sparkle size={20} color={accent.base} />
          <Text variant="label" color={accent.deep}>
            Ask Mosey
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBlock}>
          <Text variant="overline" color={accent.deep}>
            {t.trip_type.replace('_', ' ')} · {t.pace}
          </Text>
          <Text variant="hero">{t.name}</Text>
          <Text variant="body" color={palette.inkSoft}>
            {t.destination} · {fmtDateRange(t.start_date, t.end_date)}
          </Text>
          {t.hard_nos ? (
            <View style={[styles.hardNos, { backgroundColor: accent.tintSoft }]}>
              <Ionicons name="hand-left-outline" size={14} color={accent.deep} />
              <Text variant="caption" color={accent.deep}>
                Hard nos: {t.hard_nos}
              </Text>
            </View>
          ) : null}
        </View>

        <StatusBar status={t.status} accent={accent.base} onSet={setStatus} onPostTrip={() => router.push(`/(app)/trip/${t.id}/post-trip`)} />

        <View style={styles.segmented}>
          {TABS.map((tb) => {
            const active = tab === tb.key;
            return (
              <Pressable
                key={tb.key}
                onPress={() => setTab(tb.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.segment, active && { backgroundColor: accent.base }]}
              >
                <Ionicons name={tb.icon} size={16} color={active ? palette.white : palette.inkSoft} />
                <Text variant="label" color={active ? palette.white : palette.inkSoft}>
                  {tb.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.panel}>
          {tab === 'timeline' && <TimelinePanel trip={t} />}
          {tab === 'packing' && <PackingPanel trip={t} />}
          {tab === 'transit' && <GettingTherePanel trip={t} />}
        </View>
      </ScrollView>
    </Screen>
  );
}

function StatusBar({
  status,
  accent,
  onSet,
  onPostTrip,
}: {
  status: TripStatus;
  accent: string;
  onSet: (s: TripStatus) => void;
  onPostTrip: () => void;
}) {
  if (status === 'planning') {
    return (
      <Card lift="none" style={styles.statusCard}>
        <Text variant="caption" color={palette.inkSoft} style={{ flex: 1 }}>
          This trip is in planning. Make it active to pin it to the top of your shelf.
        </Text>
        <Button label="Make active" variant="secondary" onPress={() => onSet('active')} />
      </Card>
    );
  }
  if (status === 'active') {
    return (
      <Card lift="none" style={styles.statusCard}>
        <Text variant="caption" color={palette.inkSoft} style={{ flex: 1 }}>
          Trip’s on. When you’re home, wrap it up to save what worked.
        </Text>
        <Button label="Wrap up" variant="secondary" onPress={onPostTrip} />
      </Card>
    );
  }
  return (
    <Card lift="none" style={styles.statusCard}>
      <Text variant="caption" color={palette.inkSoft} style={{ flex: 1 }}>
        Archived. Your hits & misses inform the next trip.
      </Text>
      <Button label="Edit memories" variant="secondary" onPress={onPostTrip} />
    </Card>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityLabel="Back" accessibilityRole="button">
      <Ionicons name="chevron-back" size={26} color={palette.ink} />
    </Pressable>
  );
}

function Center({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <Text variant="body" color={palette.inkSoft}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  sparkleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 },
  titleBlock: { gap: spacing.xs },
  hardNos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: spacing.sm,
  },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.card },
  segmented: {
    flexDirection: 'row',
    backgroundColor: palette.card,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: palette.line,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    minHeight: 44,
  },
  panel: { minHeight: 200 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
