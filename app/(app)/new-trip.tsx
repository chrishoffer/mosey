import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Button, Card, Screen, Text } from '../../src/components/ui';
import { DateField } from '../../src/components/DateField';
import { useChildren, useCreateTrip, useTrips } from '../../src/hooks';
import { fetchTimeline } from '../../src/data/api';
import { scheduleTimelineNotifications } from '../../src/lib/notifications';
import { accentList, getAccent, kidColors, palette, radius, spacing } from '../../src/theme/tokens';
import { ageFromBirthYear, type Pace, type TransitMode, type TripType } from '../../src/types/db';

const TRIP_TYPES: { key: TripType; label: string }[] = [
  { key: 'cruise', label: 'Cruise' },
  { key: 'resort', label: 'Resort' },
  { key: 'road_trip', label: 'Road trip' },
  { key: 'city', label: 'City' },
  { key: 'other', label: 'Other' },
];
const TRANSIT: { key: TransitMode; label: string }[] = [
  { key: 'fly', label: 'Fly' },
  { key: 'drive', label: 'Drive' },
  { key: 'both', label: 'Both' },
];
const PACES: { key: Pace; label: string; hint: string }[] = [
  { key: 'chill', label: 'Chill', hint: 'Lots of downtime' },
  { key: 'balanced', label: 'Balanced', hint: 'A bit of both' },
  { key: 'packed', label: 'Packed', hint: 'See it all' },
];

export default function NewTrip() {
  const router = useRouter();
  const children = useChildren();
  const trips = useTrips();
  const createTrip = useCreateTrip();

  const [destination, setDestination] = useState('');
  const [name, setName] = useState('');
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [childIds, setChildIds] = useState<string[]>([]);
  const [transit, setTransit] = useState<TransitMode>('fly');
  const [tripType, setTripType] = useState<TripType>('resort');
  const [pace, setPace] = useState<Pace>('balanced');
  const [hardNos, setHardNos] = useState('');

  // Default accent rotates by how many trips exist, so the shelf stays colorful.
  const defaultAccent = accentList[(trips.data?.length ?? 0) % accentList.length].key;
  const [accent, setAccent] = useState<string>(defaultAccent);

  const tripName = useMemo(
    () => (name.trim() ? name.trim() : destination.trim() ? `${destination.trim()} trip` : ''),
    [name, destination],
  );

  function toggleChild(id: string) {
    setChildIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit() {
    if (!destination.trim()) return Alert.alert('Where to?', 'Add a destination first.');
    if (!start || !end) return Alert.alert('When?', 'Pick your start and end dates.');
    if (end < start) return Alert.alert('Check your dates', 'The end date is before the start date.');

    try {
      const trip = await createTrip.mutateAsync({
        name: tripName,
        destination: destination.trim(),
        trip_type: tripType,
        transit_mode: transit,
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd'),
        pace,
        hard_nos: hardNos.trim() || null,
        accent_color: accent,
        childIds,
      });
      // Schedule local notifications for the freshly-seeded timeline (best-effort).
      const events = await fetchTimeline(trip.id);
      await scheduleTimelineNotifications(trip.name, events);
      router.replace(`/(app)/trip/${trip.id}`);
    } catch (e) {
      Alert.alert('Could not create trip', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  const accentColor = getAccent(accent);

  return (
    <Screen edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
          <Ionicons name="close" size={26} color={palette.ink} />
        </Pressable>
        <Text variant="subtitle">New trip</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Where are you headed?">
          <TextInput
            style={styles.input}
            placeholder="e.g. Eastern Caribbean"
            placeholderTextColor={palette.inkSoft}
            value={destination}
            onChangeText={setDestination}
          />
        </Field>

        <Field label="Trip name" hint={tripName ? undefined : 'We’ll name it for you if you skip this'}>
          <TextInput
            style={styles.input}
            placeholder={destination ? `${destination} trip` : 'Trip name'}
            placeholderTextColor={palette.inkSoft}
            value={name}
            onChangeText={setName}
          />
        </Field>

        <View style={styles.dates}>
          <DateField label="Start" value={start} onChange={setStart} minimumDate={new Date(2020, 0, 1)} />
          <DateField label="End" value={end} onChange={setEnd} minimumDate={start ?? undefined} />
        </View>

        <Field label="Who’s coming?">
          {children.isLoading ? (
            <Text variant="caption" color={palette.inkSoft}>Loading family…</Text>
          ) : (children.data ?? []).length === 0 ? (
            <Card lift="none" style={styles.noKids}>
              <Text variant="caption" color={palette.inkSoft}>
                No kids saved yet. Add them in the Family tab and they’ll show up here for every trip.
              </Text>
            </Card>
          ) : (
            <View style={styles.kidWrap}>
              {(children.data ?? []).map((c) => {
                const selected = childIds.includes(c.id);
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => toggleChild(c.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.kidChip,
                      { borderColor: c.color },
                      selected && { backgroundColor: c.color },
                    ]}
                  >
                    <View style={[styles.kidDot, { backgroundColor: selected ? palette.white : c.color }]} />
                    <Text variant="label" color={selected ? palette.white : palette.ink}>
                      {c.name} · {ageFromBirthYear(c.birth_year)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Field>

        <ChoiceRow<TripType> label="Trip type" options={TRIP_TYPES} value={tripType} onChange={setTripType} />
        <ChoiceRow<TransitMode> label="Getting there" options={TRANSIT} value={transit} onChange={setTransit} />

        <Field label="Pace">
          <View style={styles.paceRow}>
            {PACES.map((p) => {
              const active = pace === p.key;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => setPace(p.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.paceCard, active && { backgroundColor: palette.ink, borderColor: palette.ink }]}
                >
                  <Text variant="bodyStrong" color={active ? palette.white : palette.ink}>
                    {p.label}
                  </Text>
                  <Text variant="caption" color={active ? 'rgba(255,255,255,0.8)' : palette.inkSoft}>
                    {p.hint}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Hard nos" hint="Anything to avoid? (optional)">
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="e.g. no early mornings, peanut allergy, no long bus rides"
            placeholderTextColor={palette.inkSoft}
            multiline
            value={hardNos}
            onChangeText={setHardNos}
          />
        </Field>

        <Field label="Trip color">
          <View style={styles.colorRow}>
            {accentList.map((a) => (
              <Pressable
                key={a.key}
                onPress={() => setAccent(a.key)}
                accessibilityRole="button"
                accessibilityLabel={a.label}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: a.base },
                  accent === a.key && styles.colorSelected,
                ]}
              />
            ))}
          </View>
        </Field>

        <Button
          label="Create trip"
          onPress={submit}
          loading={createTrip.isPending}
          style={{ backgroundColor: accentColor.base, marginTop: spacing.md }}
        />
        <Text variant="caption" color={palette.inkSoft} style={styles.footnote}>
          Mosey will draft your packing list and getting-there kit next.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text variant="label">{label}</Text>
      {children}
      {hint ? (
        <Text variant="caption" color={palette.inkSoft}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function ChoiceRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label}>
      <View style={styles.choiceWrap}>
        {options.map((o) => {
          const active = value === o.key;
          return (
            <Pressable
              key={o.key}
              onPress={() => onChange(o.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.choice, active && { backgroundColor: palette.ink, borderColor: palette.ink }]}
            >
              <Text variant="label" color={active ? palette.white : palette.ink}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Field>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 },
  field: { gap: spacing.sm },
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
    minHeight: 50,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  dates: { flexDirection: 'row', gap: spacing.md },
  kidWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  kidDot: { width: 12, height: 12, borderRadius: 6 },
  noKids: { backgroundColor: palette.card },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: palette.card,
    minHeight: 44,
    justifyContent: 'center',
  },
  paceRow: { flexDirection: 'row', gap: spacing.sm },
  paceCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: palette.card,
    gap: 2,
  },
  colorRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  colorSwatch: { width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: 'transparent' },
  colorSelected: { borderColor: palette.ink },
  footnote: { textAlign: 'center' },
});
