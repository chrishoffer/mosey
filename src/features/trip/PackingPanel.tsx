import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, ProgressBar, Text } from '../../components/ui';
import {
  useAddPackingItem,
  useDeletePackingItem,
  usePacking,
  useSetPacked,
  useTravelers,
} from '../../hooks';
import { generatePackingList } from '../../lib/ai';
import { getAccent, palette, radius, spacing } from '../../theme/tokens';
import type { Child, PackingItem, Trip } from '../../types/db';

export function PackingPanel({ trip }: { trip: Trip }) {
  const accent = getAccent(trip.accent_color);
  const packing = usePacking(trip.id);
  const travelers = useTravelers(trip.id);
  const setPacked = useSetPacked(trip.id);
  const addItem = useAddPackingItem(trip.id);
  const delItem = useDeletePackingItem(trip.id);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const items = packing.data ?? [];
  const childById = useMemo(() => {
    const m = new Map<string, Child>();
    (travelers.data ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [travelers.data]);

  const groups = useMemo(() => groupItems(items, travelers.data ?? []), [items, travelers.data]);
  const packedCount = items.filter((i) => i.is_packed).length;
  const progress = items.length ? packedCount / items.length : 0;

  async function generate() {
    setGenError(null);
    setGenerating(true);
    const res = await generatePackingList(trip.id);
    setGenerating(false);
    if (!res.ok) {
      setGenError(res.error ?? 'Generation failed. Try again.');
      return;
    }
    packing.refetch();
  }

  if (packing.isLoading) return <Message text="Loading your packing list…" />;

  if (items.length === 0) {
    return (
      <View style={styles.wrap}>
        <Card lift="soft">
          <Text variant="title">Smart packing list</Text>
          <Text variant="body" color={palette.inkSoft} style={{ marginTop: spacing.sm }}>
            Mosey will build a per-kid and shared list tailored to {trip.destination}, your dates, and
            each child’s ages and notes.
          </Text>
          <Button
            label={generating ? 'Thinking…' : 'Generate packing list'}
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
      <Card lift="soft">
        <View style={styles.progressHead}>
          <Text variant="bodyStrong">
            {packedCount} of {items.length} packed
          </Text>
          <Pressable onPress={generate} disabled={generating} hitSlop={8} accessibilityLabel="Regenerate list">
            <Ionicons name="sparkles-outline" size={20} color={generating ? palette.inkSoft : accent.base} />
          </Pressable>
        </View>
        <View style={{ marginTop: spacing.sm }}>
          <ProgressBar value={progress} color={accent.base} />
        </View>
      </Card>

      {groups.map((g) => (
        <View key={g.key} style={styles.group}>
          <View style={styles.groupHead}>
            {g.child && <View style={[styles.kidDot, { backgroundColor: g.child.color }]} />}
            <Text variant="overline" color={palette.inkSoft}>
              {g.title}
            </Text>
          </View>
          {g.items.map((it) => (
            <PackRow
              key={it.id}
              item={it}
              accent={accent.base}
              onToggle={() => setPacked.mutate({ id: it.id, is_packed: !it.is_packed })}
              onDelete={
                it.source === 'manual'
                  ? () => delItem.mutate(it.id)
                  : undefined
              }
            />
          ))}
        </View>
      ))}

      <AddItemRow
        travelers={travelers.data ?? []}
        onAdd={(input) => addItem.mutate(input)}
        pending={addItem.isPending}
      />
      {genError ? (
        <Text variant="caption" color={palette.danger}>
          {genError}
        </Text>
      ) : null}
    </View>
  );
}

function PackRow({
  item,
  accent,
  onToggle,
  onDelete,
}: {
  item: PackingItem;
  accent: string;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card lift="soft" style={styles.itemCard}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.is_packed }}
        accessibilityLabel={`${item.label}, ${item.is_packed ? 'packed' : 'not packed'}`}
        style={styles.itemMain}
      >
        <Ionicons
          name={item.is_packed ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={item.is_packed ? accent : palette.inkSoft}
        />
        <View style={{ flex: 1 }}>
          <Text
            variant="bodyStrong"
            color={item.is_packed ? palette.inkSoft : palette.ink}
            style={item.is_packed && styles.struck}
          >
            {item.label}
          </Text>
          {item.reason ? (
            <Text variant="caption" color={palette.inkSoft} numberOfLines={2}>
              {item.reason}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {onDelete ? (
        <View style={styles.itemActions}>
          <Pressable onPress={onDelete} hitSlop={8} accessibilityLabel={`Remove ${item.label}`}>
            <Ionicons name="close" size={18} color={palette.inkSoft} />
          </Pressable>
        </View>
      ) : null}
    </Card>
  );
}

function AddItemRow({
  travelers,
  onAdd,
  pending,
}: {
  travelers: Child[];
  onAdd: (input: { label: string; category: string; child_id: string | null }) => void;
  pending: boolean;
}) {
  const [label, setLabel] = useState('');
  const [childId, setChildId] = useState<string | null>(null);
  return (
    <Card lift="none" style={styles.addCard}>
      <TextInput
        style={styles.addInput}
        placeholder="Add your own item…"
        placeholderTextColor={palette.inkSoft}
        value={label}
        onChangeText={setLabel}
        onSubmitEditing={() => {
          if (label.trim()) {
            onAdd({ label: label.trim(), category: 'custom', child_id: childId });
            setLabel('');
          }
        }}
        returnKeyType="done"
      />
      {travelers.length > 0 && (
        <View style={styles.assignRow}>
          <Pressable onPress={() => setChildId(null)} style={[styles.assignChip, childId === null && styles.assignActive]}>
            <Text variant="caption" color={childId === null ? palette.white : palette.inkSoft}>
              Shared
            </Text>
          </Pressable>
          {travelers.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setChildId(c.id)}
              style={[styles.assignChip, childId === c.id && { backgroundColor: c.color }]}
            >
              <Text variant="caption" color={childId === c.id ? palette.white : palette.inkSoft}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <Button
        label="Add"
        variant="secondary"
        loading={pending}
        onPress={() => {
          if (!label.trim()) return Alert.alert('Add an item', 'Type something to add first.');
          onAdd({ label: label.trim(), category: 'custom', child_id: childId });
          setLabel('');
        }}
      />
    </Card>
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

interface Group {
  key: string;
  title: string;
  child: Child | null;
  items: PackingItem[];
}

function groupItems(items: PackingItem[], travelers: Child[]): Group[] {
  const shared = items.filter((i) => !i.child_id);
  const groups: Group[] = [];
  if (shared.length) groups.push({ key: 'shared', title: 'Shared', child: null, items: shared });
  for (const child of travelers) {
    const kidItems = items.filter((i) => i.child_id === child.id);
    if (kidItems.length) groups.push({ key: child.id, title: child.name, child, items: kidItems });
  }
  // Any items whose child isn't a current traveler (edge case) fall under "Other".
  const known = new Set(travelers.map((t) => t.id));
  const orphan = items.filter((i) => i.child_id && !known.has(i.child_id));
  if (orphan.length) groups.push({ key: 'other', title: 'Other', child: null, items: orphan });
  return groups;
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, paddingBottom: spacing.x2 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  group: { gap: spacing.sm },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: spacing.xs },
  kidDot: { width: 12, height: 12, borderRadius: 6 },
  itemCard: { paddingVertical: spacing.md, gap: spacing.sm },
  itemMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  struck: { textDecorationLine: 'line-through' },
  itemActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  addCard: { backgroundColor: palette.card, gap: spacing.sm, marginTop: spacing.sm },
  addInput: {
    backgroundColor: palette.paper,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 16,
    color: palette.ink,
    minHeight: 48,
  },
  assignRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  assignChip: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: palette.card,
  },
  assignActive: { backgroundColor: palette.ink, borderColor: palette.ink },
});
