import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Button, Card, Screen, Text } from '../../src/components/ui';
import { DateField } from '../../src/components/DateField';
import { CrewPicker } from '../../src/components/CrewPicker';
import { useChildren, useCreateTrip, useTrips } from '../../src/hooks';
import { fetchTimeline } from '../../src/data/api';
import { scheduleTimelineNotifications } from '../../src/lib/notifications';
import { scheduleNurturePrompts } from '../../src/lib/nurture';
import { accentList, getAccent, palette, radius, spacing } from '../../src/theme/tokens';
import {
  ageFromBirthYear,
  isKid,
  RELATION_LABELS,
  type Pace,
  type Relation,
  type TransitMode,
  type TripType,
} from '../../src/types/db';

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
  { key: 'train', label: 'Train' },
  { key: 'public_transit', label: 'Public transit' },
  { key: 'both', label: 'A mix' },
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

    const selectedCrew = (children.data ?? []).filter((c) => childIds.includes(c.id));
    const hasKids = selectedCrew.some((c) => isKid(c));

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
        lodging: null,
        activities: [],
        extra_notes: null,
        accent_color: accent,
        childIds,
        hasKids,
      });
      // Schedule local notifications for the freshly-seeded timeline, plus the
      // gentle "tell Mosey more" drip between now and departure (best-effort).
      const events = await fetchTimeline(trip.id);
      await scheduleTimelineNotifications(trip.name, events);
      await scheduleNurturePrompts(trip);
      router.replace(`/(app)/trip/${trip.id}`);
    } catch (e) {
      Alert.alert('Could not create trip', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  const accentColor = getAccent(accent);

  return (
    <Screen edges={['top']} style={{ backgroundColor: accentColor.tintSoft }}>
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
          <DateField label="Start date" value={start} onChange={setStart} />
          <DateField label="End date" value={end} onChange={setEnd} minimumDate={start ?? undefined} />
        </View>

        <Field label="Who’s going?" hint="Add anyone right here — kids, partner, grandparents, friends.">
          <CrewPicker selectedIds={childIds} onToggle={toggleChild} accentBase={accentColor.base} />
        </Field>

        <ChoiceRow<TripType> label="Trip type" options={TRIP_TYPES} value={tripType} onChange={setTripType} />
        <ChoiceRow<TransitMode> label="How you’ll get there" options={TRANSIT} value={transit} onChange={setTransit} />

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
        <Text variant="caption" color={palette.inkSoft}>
          That’s all Mosey needs to start. It’ll ask a couple of quick things later — right when they
          help — to sharpen your lists and plan.
        </Text>

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
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 16,
    color: palette.ink,
    minHeight: 50,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  dates: { gap: spacing.md },
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
