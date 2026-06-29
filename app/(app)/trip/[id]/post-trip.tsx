import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Screen, Text } from '../../../../src/components/ui';
import { useSaveTripNote, useTrip, useTripNote, useUpdateTrip } from '../../../../src/hooks';
import { getAccent, palette, radius, spacing } from '../../../../src/theme/tokens';

export default function PostTrip() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const trip = useTrip(id);
  const note = useTripNote(id);
  const saveNote = useSaveTripNote(id);
  const updateTrip = useUpdateTrip();

  const [hits, setHits] = useState('');
  const [misses, setMisses] = useState('');

  useEffect(() => {
    if (note.data) {
      setHits(note.data.hits ?? '');
      setMisses(note.data.misses ?? '');
    }
  }, [note.data]);

  const accent = getAccent(trip.data?.accent_color);

  async function save() {
    try {
      await saveNote.mutateAsync({ hits: hits.trim() || null, misses: misses.trim() || null });
      // Wrapping up a trip archives it so it moves to the Memories shelf.
      if (trip.data && trip.data.status !== 'archived') {
        await updateTrip.mutateAsync({ id, patch: { status: 'archived' } });
      }
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={palette.ink} />
        </Pressable>
        <Text variant="subtitle">Wrap up the trip</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card lift="soft" style={{ backgroundColor: accent.tintSoft }}>
            <Text variant="title" color={accent.deep}>
              How did it go?
            </Text>
            <Text variant="body" color={palette.inkSoft} style={{ marginTop: spacing.xs }}>
              A quick note now makes your next trip smarter. Mosey remembers what worked and what to
              skip — no need to start from scratch again.
            </Text>
          </Card>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Ionicons name="happy-outline" size={18} color={palette.success} />
              <Text variant="bodyStrong">Hits — what worked?</Text>
            </View>
            <TextInput
              style={[styles.input, styles.multi]}
              placeholder="The early dinners, the travel-day snack bag, packing cubes per kid…"
              placeholderTextColor={palette.inkSoft}
              multiline
              value={hits}
              onChangeText={setHits}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Ionicons name="sad-outline" size={18} color={palette.danger} />
              <Text variant="bodyStrong">Misses — what to change?</Text>
            </View>
            <TextInput
              style={[styles.input, styles.multi]}
              placeholder="Overpacked toys, forgot motion-sickness bands, too many packed days in a row…"
              placeholderTextColor={palette.inkSoft}
              multiline
              value={misses}
              onChangeText={setMisses}
            />
          </View>

          <Button
            label="Save & archive trip"
            onPress={save}
            loading={saveNote.isPending || updateTrip.isPending}
            style={{ backgroundColor: accent.base }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 },
  field: { gap: spacing.sm },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 16,
    color: palette.ink,
  },
  multi: { minHeight: 110, textAlignVertical: 'top' },
});
