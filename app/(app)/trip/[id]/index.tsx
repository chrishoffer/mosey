import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Screen, Text } from '../../../../src/components/ui';
import { Sparkle } from '../../../../src/components/Sparkle';
import { TimelinePanel } from '../../../../src/features/trip/TimelinePanel';
import { PackingPanel } from '../../../../src/features/trip/PackingPanel';
import { GettingTherePanel } from '../../../../src/features/trip/GettingTherePanel';
import { DayPlanPanel } from '../../../../src/features/trip/DayPlanPanel';
import { PrepPanel } from '../../../../src/features/trip/PrepPanel';
import { ReadinessRing } from '../../../../src/components/ReadinessRing';
import { CrewPicker } from '../../../../src/components/CrewPicker';
import { SharpenCard, tripHasGaps } from '../../../../src/components/TripQuestions';
import {
  useAddTraveler,
  useReadiness,
  useRemoveTraveler,
  useTravelers,
  useTrip,
  useUpdateTrip,
} from '../../../../src/hooks';
import { getAccent, palette, radius, shadow, spacing } from '../../../../src/theme/tokens';
import { fmtDateRange } from '../../../../src/lib/dates';
import type { TripStatus } from '../../../../src/types/db';

type Tab = 'timeline' | 'days' | 'packing' | 'transit' | 'prep';
const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'timeline', label: 'Timeline', icon: 'git-commit-outline' },
  { key: 'days', label: 'Days', icon: 'sunny-outline' },
  { key: 'packing', label: 'Packing', icon: 'checkbox-outline' },
  { key: 'transit', label: 'Getting there', icon: 'airplane-outline' },
  { key: 'prep', label: 'Prep', icon: 'home-outline' },
];

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const trip = useTrip(id);
  const updateTrip = useUpdateTrip();
  const readiness = useReadiness(id);
  const travelers = useTravelers(id);
  const addTraveler = useAddTraveler(id);
  const removeTraveler = useRemoveTraveler(id);
  const [tab, setTab] = useState<Tab>('timeline');
  const [editCrew, setEditCrew] = useState(false);

  // Nurture-card dismissal is sticky per trip (a mis-tap shouldn't nag forever,
  // and an intentional dismiss should be respected across sessions).
  const [dismissNurture, setDismissNurture] = useState(true);
  useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem(`mosey.nurtureDismissed.${id}`).then((v) => setDismissNurture(v === '1'));
  }, [id]);
  function dismissNurtureCard() {
    setDismissNurture(true);
    if (id) AsyncStorage.setItem(`mosey.nurtureDismissed.${id}`, '1');
  }

  const travelerIds = (travelers.data ?? []).map((c) => c.id);
  function toggleTraveler(childId: string) {
    if (travelerIds.includes(childId)) removeTraveler.mutate(childId);
    else addTraveler.mutate(childId);
  }

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
    <Screen style={{ backgroundColor: accent.tintSoft }}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Pressable
          onPress={() => router.push({ pathname: '/(app)/ask', params: { trip: t.id } })}
          accessibilityRole="button"
          accessibilityLabel="Ask Mosey about this trip"
          style={[styles.sparkleBtn, { backgroundColor: palette.card, borderColor: accent.base }]}
          hitSlop={8}
        >
          <Sparkle size={20} color={accent.base} />
          <Text variant="label" color={accent.deep}>
            Ask Mosey
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={accent.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.titleBlock, shadow.hero]}
        >
          <Text variant="overline" color="rgba(255,255,255,0.85)">
            {t.trip_type.replace('_', ' ')} · {t.pace}
          </Text>
          <Text variant="hero" color={palette.white}>
            {t.name}
          </Text>
          <Text variant="label" color="rgba(255,255,255,0.92)">
            {t.destination} · {fmtDateRange(t.start_date, t.end_date)}
          </Text>
          {t.hard_nos ? (
            <View style={[styles.hardNos, { backgroundColor: palette.card }]}>
              <Ionicons name="hand-left-outline" size={14} color={accent.deep} />
              <Text variant="caption" color={accent.deep}>
                Hard nos: {t.hard_nos}
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        <Card lift="none" style={styles.crewCard}>
          <View style={styles.crewHead}>
            <View style={styles.crewTitle}>
              <Ionicons name="people" size={18} color={accent.deep} />
              <Text variant="bodyStrong">Who’s going</Text>
            </View>
            <Pressable onPress={() => setEditCrew((v) => !v)} hitSlop={8} accessibilityRole="button">
              <Text variant="label" color={accent.deep}>
                {editCrew ? 'Done' : 'Edit'}
              </Text>
            </Pressable>
          </View>
          {editCrew ? (
            <CrewPicker selectedIds={travelerIds} onToggle={toggleTraveler} accentBase={accent.base} />
          ) : travelerIds.length === 0 ? (
            <Text variant="caption" color={palette.inkSoft}>
              No one added yet. Tap Edit to add your crew — packing and the day plan tailor to them.
            </Text>
          ) : (
            <View style={styles.crewChips}>
              {(travelers.data ?? []).map((c) => (
                <View key={c.id} style={[styles.crewChip, { backgroundColor: c.color }]}>
                  <Text variant="label" color={palette.white}>
                    {c.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {tripHasGaps(t) && !dismissNurture && (
          <Card lift="soft" style={[styles.nurtureCard, { backgroundColor: accent.tint }]}>
            <View style={styles.nurtureHead}>
              <View style={styles.crewTitle}>
                <Ionicons name="sparkles" size={16} color={accent.deep} />
                <Text variant="bodyStrong" color={accent.deep}>
                  Help Mosey tailor this trip
                </Text>
              </View>
              <Pressable onPress={dismissNurtureCard} hitSlop={8} accessibilityLabel="Dismiss">
                <Ionicons name="close" size={18} color={accent.deep} />
              </Pressable>
            </View>
            <Text variant="caption" color={accent.deep}>
              A few optional details make the lists and day plan noticeably sharper.
            </Text>
            <SharpenCard trip={t} accent={accent.base} deep={accent.deep} defaultOpen title="Answer a few quick things" />
          </Card>
        )}

        {readiness.total > 0 && (
          <Card lift="soft" style={styles.readyCard}>
            <ReadinessRing
              ratio={readiness.overall}
              size={66}
              color={accent.base}
              centerLabel={`${Math.round(readiness.overall * 100)}%`}
            />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Trip readiness</Text>
              <Text variant="caption" color={palette.inkSoft}>
                {readiness.parts
                  .map((p) => `${p.label} ${p.done}/${p.total}`)
                  .join(' · ')}
              </Text>
            </View>
          </Card>
        )}

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
                style={[styles.segment, active && { backgroundColor: accent.base, borderColor: accent.base }]}
              >
                <Ionicons name={tb.icon} size={15} color={active ? palette.white : palette.inkSoft} />
                <Text variant="label" color={active ? palette.white : palette.inkSoft}>
                  {tb.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.panel}>
          {tab === 'timeline' && <TimelinePanel trip={t} />}
          {tab === 'days' && <DayPlanPanel trip={t} />}
          {tab === 'packing' && <PackingPanel trip={t} />}
          {tab === 'transit' && <GettingTherePanel trip={t} />}
          {tab === 'prep' && <PrepPanel trip={t} />}
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
  titleBlock: { gap: spacing.xs, padding: spacing.xl, borderRadius: radius.xl },
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
  readyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  crewCard: { gap: spacing.sm, backgroundColor: palette.card },
  crewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  crewTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  crewChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  crewChip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  nurtureCard: { gap: spacing.sm },
  nurtureHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segmented: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.card,
    borderWidth: 1.5,
    borderColor: palette.line,
    borderRadius: radius.pill,
    minHeight: 42,
  },
  panel: { minHeight: 200 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
