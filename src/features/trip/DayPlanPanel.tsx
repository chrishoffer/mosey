import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Text } from '../../components/ui';
import { useDays } from '../../hooks';
import { generateDayPlan } from '../../lib/ai';
import { fmtDate } from '../../lib/dates';
import { getAccent, palette, spacing } from '../../theme/tokens';
import type { Trip, TripDay } from '../../types/db';

const BLOCKS: { key: keyof Pick<TripDay, 'morning' | 'afternoon' | 'evening'>; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'morning', label: 'Morning', icon: 'sunny-outline' },
  { key: 'afternoon', label: 'Afternoon', icon: 'partly-sunny-outline' },
  { key: 'evening', label: 'Evening', icon: 'moon-outline' },
];

export function DayPlanPanel({ trip }: { trip: Trip }) {
  const accent = getAccent(trip.accent_color);
  const days = useDays(trip.id);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  async function generate() {
    setGenError(null);
    setGenerating(true);
    const res = await generateDayPlan(trip.id);
    setGenerating(false);
    if (!res.ok) {
      setGenError(res.error ?? 'Generation failed. Try again.');
      return;
    }
    days.refetch();
  }

  if (days.isLoading) return <Message text="Loading your day plan…" />;

  const list = days.data ?? [];

  if (list.length === 0) {
    return (
      <View style={styles.wrap}>
        <Card lift="soft">
          <Text variant="title">A gentle day-by-day flow</Text>
          <Text variant="body" color={palette.inkSoft} style={{ marginTop: spacing.sm }}>
            Mosey will sketch an easy rhythm for each day — built around your pace and your crew’s
            ages (nap windows included). It’s general guidance, not a rigid schedule, and it never
            invents specific places.
          </Text>
          <Button
            label={generating ? 'Sketching your days…' : 'Plan my days'}
            onPress={generate}
            loading={generating}
            style={{ marginTop: spacing.lg, backgroundColor: accent.base }}
          />
          {genError ? (
            <Text variant="caption" color={palette.danger} style={{ marginTop: spacing.sm }}>
              {genError}
            </Text>
          ) : null}
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <Text variant="caption" color={palette.inkSoft}>
          An easy rhythm — adjust as the trip unfolds.
        </Text>
        <Pressable onPress={generate} disabled={generating} hitSlop={8} accessibilityLabel="Regenerate day plan">
          <Ionicons name="sparkles-outline" size={20} color={generating ? palette.inkSoft : accent.base} />
        </Pressable>
      </View>

      {list.map((d) => (
        <Card key={d.id} lift="soft" style={styles.dayCard}>
          <View style={styles.dayHead}>
            <View style={[styles.dayBadge, { backgroundColor: accent.tint }]}>
              <Text variant="overline" color={accent.deep}>
                Day {d.day_index + 1}
              </Text>
            </View>
            <Text variant="caption" color={palette.inkSoft}>
              {fmtDate(d.date)}
            </Text>
          </View>
          <Text variant="subtitle" style={{ marginTop: spacing.xs }}>
            {d.title}
          </Text>
          <View style={styles.blocks}>
            {BLOCKS.map((b) =>
              d[b.key] ? (
                <View key={b.key} style={styles.block}>
                  <Ionicons name={b.icon} size={16} color={accent.deep} style={styles.blockIcon} />
                  <View style={{ flex: 1 }}>
                    <Text variant="overline" color={palette.inkSoft}>
                      {b.label}
                    </Text>
                    <Text variant="body">{d[b.key]}</Text>
                  </View>
                </View>
              ) : null,
            )}
          </View>
        </Card>
      ))}
      {genError ? (
        <Text variant="caption" color={palette.danger}>
          {genError}
        </Text>
      ) : null}
    </View>
  );
}

function Message({ text }: { text: string }) {
  return (
    <View style={styles.wrap}>
      <Card lift="none">
        <Text variant="body" color={palette.inkSoft}>
          {text}
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, paddingBottom: spacing.x2 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayCard: { gap: spacing.xs },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayBadge: { borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 4 },
  blocks: { marginTop: spacing.sm, gap: spacing.md },
  block: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  blockIcon: { marginTop: 2 },
});
