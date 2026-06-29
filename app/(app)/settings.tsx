import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Divider, Screen, Text } from '../../src/components/ui';
import { Sparkle } from '../../src/components/Sparkle';
import { useChildren, useCreateChild, useDeleteChild, useProfile } from '../../src/hooks';
import { useAuth } from '../../src/lib/auth';
import { updateDisplayName } from '../../src/data/api';
import { kidColors, palette, radius, spacing } from '../../src/theme/tokens';
import { ageFromBirthYear } from '../../src/types/db';

export default function Settings() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const profile = useProfile();
  const children = useChildren();
  const createChild = useCreateChild();
  const deleteChild = useDeleteChild();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState<string>(kidColors[0]);

  const thisYear = new Date().getFullYear();

  async function addChild() {
    const yr = parseInt(birthYear, 10);
    if (!name.trim() || Number.isNaN(yr) || yr < thisYear - 25 || yr > thisYear) {
      Alert.alert('Check the details', 'Enter a name and a valid birth year.');
      return;
    }
    await createChild.mutateAsync({ name: name.trim(), birth_year: yr, notes: notes.trim() || null, color });
    setName('');
    setBirthYear('');
    setNotes('');
    setColor(kidColors[(children.data?.length ?? 0) % kidColors.length]);
    setAdding(false);
  }

  function confirmDelete(id: string, childName: string) {
    Alert.alert('Remove child', `Remove ${childName} from your family? Past trips keep their record.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteChild.mutate(id) },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="hero">Family</Text>
        <Text variant="body" color={palette.inkSoft}>
          Add your kids once — every trip reuses them, so each new trip feels lighter.
        </Text>

        <Card>
          <Text variant="overline" color={palette.inkSoft}>
            Your name
          </Text>
          <DisplayNameEditor
            initial={profile.data?.display_name ?? ''}
            userId={session?.user?.id ?? ''}
            onSaved={() => profile.refetch()}
          />
        </Card>

        <View style={styles.kidsHeader}>
          <Text variant="heading">Kids</Text>
          {!adding && (
            <Button
              label="Add"
              variant="secondary"
              onPress={() => setAdding(true)}
              icon={<Ionicons name="add" size={18} color={palette.ink} />}
            />
          )}
        </View>

        {children.isLoading ? (
          <Text variant="caption" color={palette.inkSoft}>
            Loading…
          </Text>
        ) : (children.data ?? []).length === 0 && !adding ? (
          <Card lift="none" style={styles.emptyKids}>
            <Text variant="body" color={palette.inkSoft}>
              No kids yet. Add them so Mosey can tailor packing and the transit kit to each one.
            </Text>
          </Card>
        ) : (
          (children.data ?? []).map((c) => (
            <Card key={c.id} lift="none" style={styles.kidRow}>
              <View style={[styles.kidDot, { backgroundColor: c.color }]} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">
                  {c.name} · age {ageFromBirthYear(c.birth_year)}
                </Text>
                {c.notes ? (
                  <Text variant="caption" color={palette.inkSoft} numberOfLines={2}>
                    {c.notes}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => confirmDelete(c.id, c.name)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${c.name}`}
              >
                <Ionicons name="trash-outline" size={20} color={palette.inkSoft} />
              </Pressable>
            </Card>
          ))
        )}

        {adding && (
          <Card>
            <Text variant="overline" color={palette.inkSoft}>
              New child
            </Text>
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor={palette.inkSoft} value={name} onChangeText={setName} />
            <TextInput
              style={styles.input}
              placeholder={`Birth year (e.g. ${thisYear - 6})`}
              placeholderTextColor={palette.inkSoft}
              keyboardType="number-pad"
              value={birthYear}
              onChangeText={setBirthYear}
            />
            <TextInput
              style={[styles.input, styles.notes]}
              placeholder="Notes — fears, foods, quirks (optional)"
              placeholderTextColor={palette.inkSoft}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
            <Text variant="label" style={{ marginTop: spacing.sm }}>
              Color
            </Text>
            <View style={styles.colorRow}>
              {kidColors.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${c}`}
                  style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSelected]}
                />
              ))}
            </View>
            <View style={styles.addActions}>
              <Button label="Cancel" variant="ghost" onPress={() => setAdding(false)} />
              <Button label="Save child" onPress={addChild} loading={createChild.isPending} />
            </View>
          </Card>
        )}

        <Divider />
        <Pressable
          onPress={() => router.push('/(app)/paywall')}
          accessibilityRole="button"
          style={styles.plusRow}
        >
          <Sparkle size={20} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Mosey Plus</Text>
            <Text variant="caption" color={palette.inkSoft}>
              Free in v1 — see what’s included
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.inkSoft} />
        </Pressable>

        <Divider />
        <Button label="Sign out" variant="secondary" onPress={signOut} />
        <Text variant="caption" color={palette.inkSoft} style={{ textAlign: 'center' }}>
          Mosey v1 · Mosey, don’t rush.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function DisplayNameEditor({
  initial,
  userId,
  onSaved,
}: {
  initial: string;
  userId: string;
  onSaved: () => void;
}) {
  const [val, setVal] = useState(initial);
  const [saving, setSaving] = useState(false);
  React.useEffect(() => setVal(initial), [initial]);
  return (
    <View style={styles.nameRow}>
      <TextInput
        style={[styles.input, { flex: 1, marginTop: 0 }]}
        placeholder="What should we call you?"
        placeholderTextColor={palette.inkSoft}
        value={val}
        onChangeText={setVal}
      />
      <Button
        label="Save"
        variant="secondary"
        loading={saving}
        onPress={async () => {
          if (!userId) return;
          setSaving(true);
          try {
            await updateDisplayName(userId, val.trim());
            onSaved();
          } finally {
            setSaving(false);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.x3 },
  kidsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  emptyKids: { backgroundColor: palette.card },
  kidRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  kidDot: { width: 14, height: 14, borderRadius: 7 },
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
    marginTop: spacing.sm,
    minHeight: 50,
  },
  notes: { minHeight: 72, textAlignVertical: 'top' },
  nameRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.sm },
  colorRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  colorSwatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  colorSelected: { borderColor: palette.ink },
  addActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
  plusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
});
