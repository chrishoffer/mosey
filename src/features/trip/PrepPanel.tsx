import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, ProgressBar, Text } from '../../components/ui';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import {
  useAddHomeTask,
  useAddLogistics,
  useDeleteHomeTask,
  useDeleteLogistics,
  useHomeTasks,
  useLogistics,
  useSetHomeTaskDone,
  useSyncDefaultHomeTasks,
  useTravelers,
} from '../../hooks';
import { getAccent, palette, radius, spacing } from '../../theme/tokens';
import { isKid, LOGISTICS_LABELS, type LogisticsKind, type Trip } from '../../types/db';

const KINDS: LogisticsKind[] = ['confirmation', 'lodging', 'flight', 'ground', 'reservation', 'contact', 'other'];

/** Per-type fields. The first field is the headline (label); the rest compose the
 *  detail. Contextual to what you picked — a flight asks for the airline, lodging
 *  for the brand/address, ground transport for rental/rideshare, etc. */
const FIELD_SETS: Record<LogisticsKind, { key: string; placeholder: string }[]> = {
  flight: [
    { key: 'Airline', placeholder: 'Airline (e.g. Delta, United)' },
    { key: 'Flight #', placeholder: 'Flight number(s)' },
    { key: 'Departs', placeholder: 'Departure date & time' },
    { key: 'Confirmation #', placeholder: 'Confirmation / record locator' },
  ],
  lodging: [
    { key: 'Name', placeholder: 'Hotel / rental name & brand' },
    { key: 'Address', placeholder: 'Address' },
    { key: 'Check-in', placeholder: 'Check-in date & time' },
    { key: 'Confirmation #', placeholder: 'Confirmation number' },
  ],
  ground: [
    { key: 'Provider', placeholder: 'Rental co. / rideshare / shuttle' },
    { key: 'Type', placeholder: 'Rental car, taxi, train, shuttle…' },
    { key: 'Pickup', placeholder: 'Pickup time / location' },
    { key: 'Confirmation #', placeholder: 'Confirmation number' },
  ],
  reservation: [
    { key: 'Name', placeholder: 'What’s reserved' },
    { key: 'When', placeholder: 'Date & time' },
    { key: 'Party', placeholder: 'Party size / notes' },
    { key: 'Confirmation #', placeholder: 'Confirmation number' },
  ],
  confirmation: [
    { key: 'For', placeholder: 'What it’s for' },
    { key: 'Number', placeholder: 'Confirmation number' },
  ],
  contact: [
    { key: 'Name', placeholder: 'Name' },
    { key: 'Phone / email', placeholder: 'Phone or email' },
    { key: 'Note', placeholder: 'Note (optional)' },
  ],
  other: [
    { key: 'Label', placeholder: 'Label' },
    { key: 'Details', placeholder: 'Details' },
  ],
};

export function PrepPanel({ trip }: { trip: Trip }) {
  const accent = getAccent(trip.accent_color);
  return (
    <View style={styles.wrap}>
      <LogisticsSection trip={trip} accent={accent.base} deep={accent.deep} />
      <HomeSection trip={trip} accent={accent.base} />
    </View>
  );
}

function LogisticsSection({ trip, accent, deep }: { trip: Trip; accent: string; deep: string }) {
  const logistics = useLogistics(trip.id);
  const add = useAddLogistics(trip.id);
  const del = useDeleteLogistics(trip.id);

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<LogisticsKind>('confirmation');
  const [values, setValues] = useState<Record<string, string>>({});

  function setKindReset(k: LogisticsKind) {
    setKind(k);
    setValues({});
  }

  function submit() {
    const fields = FIELD_SETS[kind];
    const filled = fields.filter((f) => (values[f.key] ?? '').trim());
    if (filled.length === 0) return;
    const primary = (values[fields[0].key] ?? '').trim();
    const label = primary || LOGISTICS_LABELS[kind];
    const detailParts = fields
      .slice(primary ? 1 : 0)
      .filter((f) => (values[f.key] ?? '').trim())
      .map((f) => `${f.key}: ${values[f.key].trim()}`);
    add.mutate({ kind, label, detail: detailParts.join('\n') || null });
    setValues({});
    setOpen(false);
  }

  const items = logistics.data ?? [];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionTitle}>
          <Ionicons name="document-text-outline" size={18} color={deep} />
          <Text variant="heading">Logistics</Text>
        </View>
        {!open && (
          <Button label="Add" variant="secondary" onPress={() => setOpen(true)} icon={<Ionicons name="add" size={16} color={palette.ink} />} />
        )}
      </View>
      <Text variant="caption" color={palette.inkSoft}>
        Confirmation numbers, check-in times, the address you’ll forget at the gate.
      </Text>

      {items.length === 0 && !open ? (
        <Card lift="none">
          <Text variant="body" color={palette.inkSoft}>
            Nothing stored yet. Add your confirmation numbers and times so they’re one tap away.
          </Text>
        </Card>
      ) : (
        items.map((it) => (
          <Card key={it.id} lift="soft" style={styles.logRow}>
            <View style={{ flex: 1 }}>
              <Text variant="overline" color={deep}>
                {LOGISTICS_LABELS[it.kind]}
              </Text>
              <Text variant="bodyStrong">{it.label}</Text>
              {it.detail ? (
                <Text variant="body" color={palette.inkSoft} selectable>
                  {it.detail}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={() => del.mutate(it.id)} hitSlop={8} accessibilityLabel={`Delete ${it.label}`}>
              <Ionicons name="close" size={18} color={palette.inkSoft} />
            </Pressable>
          </Card>
        ))
      )}

      {open && (
        <Card>
          <Text variant="overline" color={palette.inkSoft}>
            What kind?
          </Text>
          <View style={styles.kindRow}>
            {KINDS.map((k) => {
              const active = kind === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setKindReset(k)}
                  style={[styles.kindChip, active && { backgroundColor: palette.ink, borderColor: palette.ink }]}
                >
                  <Text variant="caption" color={active ? palette.white : palette.inkSoft}>
                    {LOGISTICS_LABELS[k]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {FIELD_SETS[kind].map((f) => (
            <TextInput
              key={f.key}
              style={styles.input}
              placeholder={f.placeholder}
              placeholderTextColor={palette.inkSoft}
              value={values[f.key] ?? ''}
              onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
            />
          ))}
          <View style={styles.formActions}>
            <Button label="Cancel" variant="ghost" onPress={() => setOpen(false)} />
            <Button label="Save" onPress={submit} loading={add.isPending} style={{ backgroundColor: accent }} />
          </View>
        </Card>
      )}
    </View>
  );
}

function HomeSection({ trip, accent }: { trip: Trip; accent: string }) {
  const tasks = useHomeTasks(trip.id);
  const travelers = useTravelers(trip.id);
  const setDone = useSetHomeTaskDone(trip.id);
  const add = useAddHomeTask(trip.id);
  const del = useDeleteHomeTask(trip.id);
  const sync = useSyncDefaultHomeTasks(trip.id);
  const [label, setLabel] = useState('');

  const items = tasks.data ?? [];
  const done = items.filter((t) => t.is_done).length;

  function refresh() {
    let tripDays = 1;
    try {
      const n = differenceInCalendarDays(parseISO(trip.end_date), parseISO(trip.start_date));
      tripDays = Number.isFinite(n) ? Math.max(1, n + 1) : 1;
    } catch {
      tripDays = 1;
    }
    const hasKids = (travelers.data ?? []).some((c) => isKid(c));
    sync.mutate({ tripDays, transitMode: trip.transit_mode, hasKids });
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionTitle}>
          <Ionicons name="home-outline" size={18} color={palette.ink} />
          <Text variant="heading">Before you leave home</Text>
        </View>
        <Pressable onPress={refresh} disabled={sync.isPending} hitSlop={8} accessibilityLabel="Refresh suggestions">
          <Ionicons name="refresh" size={18} color={sync.isPending ? palette.inkSoft : accent} />
        </Pressable>
      </View>
      <Text variant="caption" color={palette.inkSoft}>
        The “did we forget to…” list. Mosey seeded the basics — tap ⟳ after you change your crew to
        pull in fresh suggestions, and add your own.
      </Text>

      {items.length > 0 && (
        <View style={{ marginTop: spacing.xs }}>
          <ProgressBar value={items.length ? done / items.length : 0} color={accent} />
        </View>
      )}

      {items.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => setDone.mutate({ id: t.id, is_done: !t.is_done })}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: t.is_done }}
          accessibilityLabel={`${t.label}, ${t.is_done ? 'done' : 'not done'}`}
        >
          <Card lift="soft" style={styles.taskRow}>
            <Ionicons
              name={t.is_done ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={t.is_done ? accent : palette.inkSoft}
            />
            <Text
              variant="bodyStrong"
              color={t.is_done ? palette.inkSoft : palette.ink}
              style={[{ flex: 1 }, t.is_done && styles.struck]}
            >
              {t.label}
            </Text>
            <Pressable onPress={() => del.mutate(t.id)} hitSlop={8} accessibilityLabel={`Delete ${t.label}`}>
              <Ionicons name="close" size={18} color={palette.inkSoft} />
            </Pressable>
          </Card>
        </Pressable>
      ))}

      <Card lift="none" style={styles.addCard}>
        <TextInput
          style={styles.input}
          placeholder="Add your own — e.g. drop dog at sitter"
          placeholderTextColor={palette.inkSoft}
          value={label}
          onChangeText={setLabel}
          onSubmitEditing={() => {
            if (label.trim()) {
              add.mutate(label.trim());
              setLabel('');
            }
          }}
          returnKeyType="done"
        />
        <Button
          label="Add task"
          variant="secondary"
          loading={add.isPending}
          onPress={() => {
            if (label.trim()) {
              add.mutate(label.trim());
              setLabel('');
            }
          }}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xl, paddingBottom: spacing.x2 },
  section: { gap: spacing.sm },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  kindChip: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: palette.card,
  },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  struck: { textDecorationLine: 'line-through' },
  addCard: { backgroundColor: palette.card, gap: spacing.sm, marginTop: spacing.xs },
  input: {
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
    marginTop: spacing.sm,
  },
  multi: { minHeight: 72, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
});
