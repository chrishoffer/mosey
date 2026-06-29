import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Text } from '../../components/ui';
import { useSetTransitDone, useTransit, useTravelers } from '../../hooks';
import { generateTransitKit } from '../../lib/ai';
import { getAccent, palette, spacing } from '../../theme/tokens';
import { TRANSIT_LABELS, type Child, type TransitItem, type TransitKind, type Trip } from '../../types/db';

const KIND_META: Record<TransitKind, { title: string; icon: keyof typeof Ionicons.glyphMap; blurb: string }> = {
  carryon: { title: 'Carry-on', icon: 'bag-handle-outline', blurb: 'One reachable bag per kid' },
  download: { title: 'Download before you lose wifi', icon: 'cloud-download-outline', blurb: 'Load it now, not at the gate' },
  activity: { title: 'Screen-light activities', icon: 'color-wand-outline', blurb: 'For when the battery’s gone' },
  playlist: { title: 'Playlists & listening', icon: 'musical-notes-outline', blurb: 'Calm-down and sing-along' },
};
const KIND_ORDER: TransitKind[] = ['carryon', 'download', 'activity', 'playlist'];

export function GettingTherePanel({ trip }: { trip: Trip }) {
  const accent = getAccent(trip.accent_color);
  const transit = useTransit(trip.id);
  const travelers = useTravelers(trip.id);
  const setDone = useSetTransitDone(trip.id);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const items = transit.data ?? [];
  const childById = useMemo(() => {
    const m = new Map<string, Child>();
    (travelers.data ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [travelers.data]);

  async function generate() {
    setGenError(null);
    setGenerating(true);
    const res = await generateTransitKit(trip.id);
    setGenerating(false);
    if (!res.ok) {
      setGenError(res.error ?? 'Generation failed. Try again.');
      return;
    }
    transit.refetch();
  }

  if (transit.isLoading) return <Message text="Loading your getting-there kit…" />;

  if (items.length === 0) {
    return (
      <View style={styles.wrap}>
        <Card lift="soft">
          <Text variant="title">The getting-there kit</Text>
          <Text variant="body" color={palette.inkSoft} style={{ marginTop: spacing.sm }}>
            Carry-on lists per person, a download checklist, screen-light activities, and playlists —
            sized to {TRANSIT_LABELS[trip.transit_mode].toLowerCase()} and your crew.
          </Text>
          <Button
            label={generating ? 'Building your kit…' : 'Generate transit kit'}
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
          Tap to check off as you pack and load up.
        </Text>
        <Pressable onPress={generate} disabled={generating} hitSlop={8} accessibilityLabel="Regenerate kit">
          <Ionicons name="sparkles-outline" size={20} color={generating ? palette.inkSoft : accent.base} />
        </Pressable>
      </View>

      {KIND_ORDER.map((kind) => {
        const group = items.filter((i) => i.kind === kind);
        if (group.length === 0) return null;
        const meta = KIND_META[kind];
        return (
          <View key={kind} style={styles.section}>
            <View style={styles.sectionHead}>
              <Ionicons name={meta.icon} size={18} color={accent.deep} />
              <View>
                <Text variant="subtitle">{meta.title}</Text>
                <Text variant="caption" color={palette.inkSoft}>
                  {meta.blurb}
                </Text>
              </View>
            </View>
            {group.map((it) => (
              <TransitRow
                key={it.id}
                item={it}
                child={it.child_id ? childById.get(it.child_id) ?? null : null}
                accent={accent.base}
                onToggle={() => setDone.mutate({ id: it.id, is_done: !it.is_done })}
              />
            ))}
          </View>
        );
      })}
      {genError ? (
        <Text variant="caption" color={palette.danger}>
          {genError}
        </Text>
      ) : null}
    </View>
  );
}

function TransitRow({
  item,
  child,
  accent,
  onToggle,
}: {
  item: TransitItem;
  child: Child | null;
  accent: string;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.is_done }}
      accessibilityLabel={`${item.label}, ${item.is_done ? 'done' : 'not done'}`}
    >
      <Card lift="soft" style={styles.row}>
        <Ionicons
          name={item.is_done ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={item.is_done ? accent : palette.inkSoft}
        />
        <View style={{ flex: 1 }}>
          <View style={styles.labelRow}>
            {child && <View style={[styles.kidDot, { backgroundColor: child.color }]} />}
            <Text
              variant="bodyStrong"
              color={item.is_done ? palette.inkSoft : palette.ink}
              style={item.is_done && styles.struck}
            >
              {child ? `${child.name}: ` : ''}
              {item.label}
            </Text>
          </View>
          {item.detail ? (
            <Text variant="caption" color={palette.inkSoft}>
              {item.detail}
            </Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
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
  section: { gap: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  kidDot: { width: 10, height: 10, borderRadius: 5 },
  struck: { textDecorationLine: 'line-through' },
});
