import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Button, Card, Divider, Screen, Text } from '../../src/components/ui';
import { Sparkle } from '../../src/components/Sparkle';
import { ensurePermission } from '../../src/lib/notifications';
import { useChildren, useCreateChild, useDeleteChild, useProfile } from '../../src/hooks';
import { useAuth } from '../../src/lib/auth';
import { updateDisplayName } from '../../src/data/api';
import { kidColors, palette, radius, spacing } from '../../src/theme/tokens';
import { ageFromBirthYear, RELATION_LABELS, type Relation } from '../../src/types/db';

const RELATIONS: Relation[] = ['me', 'partner', 'child', 'grandparent', 'relative', 'friend', 'other'];

export default function Settings() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const profile = useProfile();
  const children = useChildren();
  const createChild = useCreateChild();
  const deleteChild = useDeleteChild();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<Relation>('child');
  const [birthYear, setBirthYear] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState<string>(kidColors[0]);

  const thisYear = new Date().getFullYear();

  async function addChild() {
    if (!name.trim()) {
      Alert.alert('Add a name', 'Everyone needs a name.');
      return;
    }
    // Birth year is optional (mainly for kids). If given, sanity-check it.
    let yr: number | null = null;
    if (birthYear.trim()) {
      const parsed = parseInt(birthYear, 10);
      if (Number.isNaN(parsed) || parsed < thisYear - 110 || parsed > thisYear) {
        Alert.alert('Check the birth year', 'Enter a valid year, or leave it blank.');
        return;
      }
      yr = parsed;
    }
    await createChild.mutateAsync({
      name: name.trim(),
      birth_year: yr,
      relation,
      notes: notes.trim() || null,
      color,
    });
    setName('');
    setRelation('child');
    setBirthYear('');
    setNotes('');
    setColor(kidColors[(children.data?.length ?? 0) % kidColors.length]);
    setAdding(false);
  }

  function confirmDelete(id: string, childName: string) {
    Alert.alert('Remove from crew', `Remove ${childName}? Past trips keep their record.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteChild.mutate(id) },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="hero">Settings</Text>
        <Text variant="body" color={palette.inkSoft}>
          Your crew, your account, and how Mosey reaches you.
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
          <Text variant="heading">Your crew</Text>
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
              No one yet. Add everyone who travels with you so Mosey can tailor packing and the
              getting-there kit — ages help most for the little ones.
            </Text>
          </Card>
        ) : (
          (children.data ?? []).map((c) => {
            const age = ageFromBirthYear(c.birth_year);
            const sub = [c.relation ? RELATION_LABELS[c.relation as Relation] : null, age != null ? `age ${age}` : null]
              .filter(Boolean)
              .join(' · ');
            return (
            <Card key={c.id} lift="none" style={styles.kidRow}>
              <View style={[styles.kidDot, { backgroundColor: c.color }]} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">
                  {c.name}
                  {sub ? ` · ${sub}` : ''}
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
            );
          })
        )}

        {adding && (
          <Card>
            <Text variant="overline" color={palette.inkSoft}>
              New traveler
            </Text>
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor={palette.inkSoft} value={name} onChangeText={setName} />

            <Text variant="label" style={{ marginTop: spacing.sm }}>
              Who is this?
            </Text>
            <View style={styles.relationRow}>
              {RELATIONS.map((r) => {
                const active = relation === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRelation(r)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.relationChip, active && { backgroundColor: palette.ink, borderColor: palette.ink }]}
                  >
                    <Text variant="label" color={active ? palette.white : palette.inkSoft}>
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
            <Text variant="caption" color={palette.inkSoft}>
              Leave birth year blank for adults — it just helps Mosey size kids’ gear.
            </Text>
            <TextInput
              style={[styles.input, styles.notes]}
              placeholder="Notes — fears, foods, dietary needs, quirks (optional)"
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
        <Text variant="heading">Notifications</Text>
        <NotificationsSection />

        <Text variant="heading" style={{ marginTop: spacing.sm }}>
          Sharing
        </Text>
        <SharingSection />

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

function NotificationsSection() {
  const [granted, setGranted] = useState<boolean | null>(null);

  React.useEffect(() => {
    Notifications.getPermissionsAsync().then((s) => setGranted(s.granted));
  }, []);

  async function enable() {
    const ok = await ensurePermission();
    setGranted(ok);
  }

  return (
    <Card lift="none" style={{ gap: spacing.sm }}>
      <View style={styles.notifRow}>
        <Ionicons
          name={granted ? 'notifications' : 'notifications-off-outline'}
          size={22}
          color={granted ? palette.success : palette.inkSoft}
        />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Trip nudges</Text>
          <Text variant="caption" color={palette.inkSoft}>
            {granted === null
              ? 'Checking…'
              : granted
                ? 'On — Mosey taps you at the right moments (passport time, download day, the night before).'
                : 'Off — turn these on so Mosey can remind you before each trip milestone.'}
          </Text>
        </View>
      </View>
      {granted === false && <Button label="Turn on reminders" onPress={enable} />}
      {granted && (
        <Text variant="caption" color={palette.inkSoft}>
          To fully silence them, use your phone’s Settings → Notifications → Mosey.
        </Text>
      )}
    </Card>
  );
}

function SharingSection() {
  return (
    <Card lift="none" style={{ gap: spacing.sm }}>
      <View style={styles.notifRow}>
        <Ionicons name="people-circle-outline" size={22} color={palette.coral} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Share a trip with a co-parent</Text>
          <Text variant="caption" color={palette.inkSoft}>
            Invite your partner so you both see the same packing list, timeline, and checklists —
            update once, you’re both covered. We’re building this now; it’ll appear here shortly.
          </Text>
        </View>
      </View>
    </Card>
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
  relationRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  relationChip: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.card,
    minHeight: 40,
    justifyContent: 'center',
  },
  colorRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  colorSwatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
  colorSelected: { borderColor: palette.ink },
  addActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
  plusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
});
