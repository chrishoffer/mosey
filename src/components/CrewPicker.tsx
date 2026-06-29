import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Text } from './ui';
import { useChildren, useCreateChild } from '../hooks';
import { kidColors, palette, radius, spacing } from '../theme/tokens';
import { ageFromBirthYear, RELATION_LABELS, type Relation } from '../types/db';

const RELATIONS: Relation[] = ['me', 'partner', 'child', 'grandparent', 'relative', 'friend', 'other'];

/**
 * Shows the saved crew as toggle chips and lets you add a brand-new person inline.
 * Used both in trip setup (selection only) and on an existing trip (where onToggle
 * persists add/remove). New people are created in the family and auto-selected.
 */
export function CrewPicker({
  selectedIds,
  onToggle,
  accentBase = palette.ink,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
  accentBase?: string;
}) {
  const children = useChildren();
  const createChild = useCreateChild();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<Relation>('child');
  const [birthYear, setBirthYear] = useState('');

  const thisYear = new Date().getFullYear();

  async function save() {
    if (!name.trim()) {
      Alert.alert('Add a name', 'Everyone needs a name.');
      return;
    }
    let yr: number | null = null;
    if (birthYear.trim()) {
      const parsed = parseInt(birthYear, 10);
      if (Number.isNaN(parsed) || parsed < thisYear - 110 || parsed > thisYear) {
        Alert.alert('Check the birth year', 'Enter a valid year, or leave it blank.');
        return;
      }
      yr = parsed;
    }
    const color = kidColors[(children.data?.length ?? 0) % kidColors.length];
    try {
      const created = await createChild.mutateAsync({
        name: name.trim(),
        birth_year: yr,
        relation,
        notes: null,
        color,
      });
      onToggle(created.id);
      setName('');
      setRelation('child');
      setBirthYear('');
      setAdding(false);
    } catch (e) {
      Alert.alert('Could not add', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.chips}>
        {(children.data ?? []).map((c) => {
          const selected = selectedIds.includes(c.id);
          const age = ageFromBirthYear(c.birth_year);
          const sub = age != null ? `${age}` : c.relation ? RELATION_LABELS[c.relation as Relation] : 'traveler';
          return (
            <Pressable
              key={c.id}
              onPress={() => onToggle(c.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.chip, { borderColor: c.color }, selected && { backgroundColor: c.color }]}
            >
              <View style={[styles.dot, { backgroundColor: selected ? palette.white : c.color }]} />
              <Text variant="label" color={selected ? palette.white : palette.ink}>
                {c.name} · {sub}
              </Text>
            </Pressable>
          );
        })}

        {!adding && (
          <Pressable onPress={() => setAdding(true)} style={[styles.chip, styles.addChip]} accessibilityLabel="Add someone new">
            <Ionicons name="add" size={16} color={palette.ink} />
            <Text variant="label">Add someone</Text>
          </Pressable>
        )}
      </View>

      {adding && (
        <Card lift="none" style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={palette.inkSoft}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <View style={styles.relRow}>
            {RELATIONS.map((r) => {
              const active = relation === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setRelation(r)}
                  style={[styles.relChip, active && { backgroundColor: palette.ink, borderColor: palette.ink }]}
                >
                  <Text variant="caption" color={active ? palette.white : palette.inkSoft}>
                    {RELATION_LABELS[r]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            placeholder={`Birth year — kids only (e.g. ${thisYear - 6})`}
            placeholderTextColor={palette.inkSoft}
            keyboardType="number-pad"
            value={birthYear}
            onChangeText={setBirthYear}
          />
          <View style={styles.formActions}>
            <Button label="Cancel" variant="ghost" onPress={() => setAdding(false)} />
            <Button label="Add" onPress={save} loading={createChild.isPending} style={{ backgroundColor: accentBase }} />
          </View>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  addChip: { borderStyle: 'dashed', borderColor: palette.inkSoft },
  dot: { width: 12, height: 12, borderRadius: 6 },
  form: { backgroundColor: palette.card, gap: spacing.sm },
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
  },
  relRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  relChip: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: palette.card,
  },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
