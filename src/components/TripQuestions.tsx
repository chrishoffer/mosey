import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui';
import { useUpdateTrip } from '../hooks';
import { cancelNurturePrompts } from '../lib/nurture';
import { palette, radius, spacing } from '../theme/tokens';
import { ACTIVITY_OPTIONS, LODGING_OPTIONS, type Trip } from '../types/db';

/** True when the trip is still missing context Mosey could use. */
export function tripHasGaps(trip: Trip): boolean {
  return !trip.lodging || !(trip.activities && trip.activities.length) || !trip.extra_notes;
}

/** A tidy collapsible "sharpen this" block — used above each Generate button and
 *  as a gentle nurture card on the trip. Expanded by default only when it's the
 *  nurture card surfacing for the first time. */
export function SharpenCard({
  trip,
  accent,
  deep,
  defaultOpen = false,
  title = 'Add a few details to sharpen this',
}: {
  trip: Trip;
  accent: string;
  deep: string;
  defaultOpen?: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={{ gap: spacing.md }}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        style={styles.toggle}
      >
        <Ionicons name="sparkles-outline" size={16} color={deep} />
        <Text variant="label" color={deep} style={{ flex: 1 }}>
          {title}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={deep} />
      </Pressable>
      {open && <TripQuestions trip={trip} accent={accent} deep={deep} />}
    </View>
  );
}

/**
 * The "tell Mosey a bit more" questions — collected *contextually* (right before a
 * generation, or as a gentle nurture card over time), NOT crammed into initial
 * setup. Each answer auto-saves to the trip so the next generation uses it.
 */
export function TripQuestions({ trip, accent, deep }: { trip: Trip; accent: string; deep: string }) {
  const update = useUpdateTrip();
  const [lodging, setLodging] = useState<string | null>(trip.lodging);
  const [activities, setActivities] = useState<string[]>(trip.activities ?? []);
  const [notes, setNotes] = useState(trip.extra_notes ?? '');

  function save(patch: Partial<Trip>) {
    update.mutate({ id: trip.id, patch });
    // Once every question is answered, the remaining scheduled "tell Mosey more"
    // drip prompts have nothing left to ask — cancel them quietly.
    const merged = { ...trip, lodging, activities, extra_notes: notes.trim() || null, ...patch };
    if (!tripHasGaps(merged as Trip)) cancelNurturePrompts(trip.id);
  }

  function pickLodging(l: string) {
    const next = lodging === l ? null : l;
    setLodging(next);
    save({ lodging: next });
  }

  function toggleActivity(a: string) {
    const next = activities.includes(a) ? activities.filter((x) => x !== a) : [...activities, a];
    setActivities(next);
    save({ activities: next });
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View>
        <Text variant="label" style={{ marginBottom: spacing.xs }}>
          Where are you staying?
        </Text>
        <View style={styles.chips}>
          {LODGING_OPTIONS.map((l) => {
            const on = lodging === l;
            return (
              <Pressable
                key={l}
                onPress={() => pickLodging(l)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.chip, on && { backgroundColor: accent, borderColor: accent }]}
              >
                <Text variant="caption" color={on ? palette.white : palette.ink}>
                  {l}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <Text variant="label" style={{ marginBottom: spacing.xs }}>
          What are you planning?
        </Text>
        <View style={styles.chips}>
          {ACTIVITY_OPTIONS.map((a) => {
            const on = activities.includes(a);
            return (
              <Pressable
                key={a}
                onPress={() => toggleActivity(a)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.chip, on && { backgroundColor: accent, borderColor: accent }]}
              >
                <Text variant="caption" color={on ? palette.white : palette.ink}>
                  {a}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <Text variant="label" style={{ marginBottom: spacing.xs }}>
          Anything else Mosey should know?
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Birthday trip, one kid gets carsick, grandma uses a walker…"
          placeholderTextColor={palette.inkSoft}
          multiline
          value={notes}
          onChangeText={setNotes}
          onEndEditing={() => save({ extra_notes: notes.trim() || null })}
          onBlur={() => save({ extra_notes: notes.trim() || null })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: palette.card,
  },
  input: {
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 16,
    color: palette.ink,
    minHeight: 64,
    textAlignVertical: 'top',
  },
});
