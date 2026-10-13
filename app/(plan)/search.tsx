import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, T } from '../../src/components/ui';
import { colors, fonts, MIN_TOUCH, radius, spacing } from '../../src/theme/tokens';
import { usePlanFlow } from '../../src/store/planFlow';
import { useSession } from '../../src/store/session';
import { searchPlaces, type PlaceSuggestion } from '../../src/lib/places';

/* Plan step 1 — where / when / who. Mockup: design/v2-mockups/Main.dc.html.
   Mock-only display constants live here (never in src/mock or src/theme). */

const DEFAULT_DESTINATION = 'Gatlinburg, Tennessee';
const DEFAULT_DATES = 'Mar 27 – Apr 1 · 5 nights';
const DEFAULT_BEDTIME = '8:00 pm';
const DEFAULT_MAX_DRIVE_MIN = 240; // "4 hr/day" in the mockup

const TEAL_DEEP = '#085F56'; // age-chip text color from the mockup
const BEDTIME_OPTIONS = ['7:00 pm', '7:30 pm', '8:00 pm', '8:30 pm'];
const MAX_DRIVE_OPTIONS = [120, 240, 360]; // minutes/day
const AGE_POOL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const TRIP_TYPES = ['Tournament weekend', 'Road trip', 'Beach week'];
const PACES = ['easy', 'balanced', 'packed'] as const;

function driveLabel(min: number) {
  return min >= 60 ? `${min / 60} hr/day` : `${min} min/day`;
}

function cycle<Item>(options: readonly Item[], current: Item): Item {
  const idx = options.indexOf(current);
  return options[(idx + 1) % options.length];
}

export default function SearchScreen() {
  const router = useRouter();
  const crewName = useSession((s) => s.name) || 'crew';
  const { destination, dates, kidAges, adults, pace, protectNap, bedtime, maxDriveMin, set } =
    usePlanFlow();

  // Live place suggestions (real locations via Open-Meteo geocoding; debounced).
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pickedRef = useRef<string | null>(null);

  function onDestinationChange(v: string) {
    set({ destination: v, destinationLat: null, destinationLng: null });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length < 2 || v === pickedRef.current) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const res = await searchPlaces(v, ctrl.signal);
      if (!ctrl.signal.aborted) setSuggestions(res);
    }, 300);
  }

  function pickPlace(s: PlaceSuggestion) {
    pickedRef.current = s.label;
    set({ destination: s.label, destinationLat: s.lat, destinationLng: s.lng });
    setSuggestions([]);
    Keyboard.dismiss();
  }
  const [tripType, setTripType] = useState<string | null>(null);

  // Seed the flow once with the mockup's sample search, so every screen
  // downstream reads live store values instead of hardcoded copy.
  useEffect(() => {
    if (!destination) {
      set({
        destination: DEFAULT_DESTINATION,
        dates: DEFAULT_DATES,
        bedtime: DEFAULT_BEDTIME,
        maxDriveMin: DEFAULT_MAX_DRIVE_MIN,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedAges = [...kidAges].sort((a, b) => a - b);

  const removeAge = (age: number) => {
    const next = [...kidAges];
    next.splice(next.indexOf(age), 1);
    set({ kidAges: next });
  };

  const addAge = () => {
    const nextAge = AGE_POOL.find((a) => !kidAges.includes(a));
    if (nextAge !== undefined) set({ kidAges: [...kidAges, nextAge] });
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Wordmark + profile */}
        <View style={styles.topRow}>
          {/* Light-surface wordmark: the shared Wordmark's sun dot would sit on the
              light ground (sun never on white), so the dot is coral here, as in Main.dc.html. */}
          <T style={styles.wordmark}>
            mosey<T style={[styles.wordmark, { color: colors.coral }]}>.</T>
          </T>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to your trips"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={styles.avatar}
          >
            <Ionicons name="close" size={20} color={colors.white} />
          </Pressable>
        </View>

        {/* Headline */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 }}>
          <T style={styles.h1}>Where to next,{'\n'}{crewName}?</T>
          <T variant="body" color={colors.muted} style={{ marginTop: 8 }}>
            Tell me the basics. I'll handle stays, days and the meltdowns.
          </T>
        </View>

        {/* Where / when / who card */}
        <View style={styles.searchCard}>
          <View style={[styles.fieldRow, styles.fieldDivider]}>
            <Ionicons name="location-outline" size={22} color={colors.teal} />
            <View style={{ flex: 1, gap: 2 }}>
              <T style={styles.fieldLabel}>Where</T>
              <TextInput
                value={destination}
                onChangeText={onDestinationChange}
                placeholder="Somewhere kid-friendly"
                placeholderTextColor={colors.faint}
                style={styles.fieldInput}
                accessibilityLabel="Where"
              />
            </View>
          </View>
          {suggestions.length > 0 && (
            <View style={styles.suggestBox}>
              {suggestions.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => pickPlace(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${s.label}`}
                  style={({ pressed }) => [styles.suggestRow, pressed && { backgroundColor: colors.ground }]}
                >
                  <Ionicons name="location" size={16} color={colors.teal} />
                  <View style={{ flex: 1 }}>
                    <T variant="bodySemi">{s.name}</T>
                    <T variant="caption" numberOfLines={1}>
                      {s.label}
                    </T>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
          <View style={[styles.fieldRow, styles.fieldDivider]}>
            <Ionicons name="calendar-outline" size={22} color={colors.teal} />
            <View style={{ flex: 1, gap: 2 }}>
              <T style={styles.fieldLabel}>When</T>
              <TextInput
                value={dates}
                onChangeText={(v) => set({ dates: v })}
                placeholder="Pick your dates"
                placeholderTextColor={colors.faint}
                style={styles.fieldInput}
                accessibilityLabel="When"
              />
            </View>
          </View>
          <View style={{ padding: 16, paddingHorizontal: 18, gap: 12 }}>
            <View style={styles.fieldRowInner}>
              <Ionicons name="people-outline" size={22} color={colors.teal} />
              <View style={{ flex: 1, gap: 2 }}>
                <T style={styles.fieldLabel}>Who</T>
                <T style={styles.fieldValue}>
                  {adults} adults · {sortedAges.length} kids · 1 suite
                </T>
              </View>
            </View>
            <View style={styles.ageRow}>
              {sortedAges.map((age) => (
                <Pressable
                  key={age}
                  onPress={() => removeAge(age)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Age ${age}, tap to remove`}
                  style={styles.ageChip}
                >
                  <T style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: TEAL_DEEP }}>Age {age}</T>
                </Pressable>
              ))}
              <Pressable
                onPress={addAge}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Add a kid"
                style={styles.addChip}
              >
                <T style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.muted }}>+ Add</T>
              </Pressable>
            </View>
          </View>
        </View>

        {/* How your family travels */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
          <T variant="section">How your family travels</T>
          <View style={styles.segmentTrack}>
            {PACES.map((p) => {
              const active = pace === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => set({ pace: p })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.segment, active && styles.segmentActive]}
                >
                  <T
                    style={{
                      fontFamily: active ? fonts.bodyBold : fonts.bodySemi,
                      fontSize: 14,
                      color: active ? colors.ink : colors.muted,
                    }}
                  >
                    {p[0].toUpperCase() + p.slice(1)}
                  </T>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SettingTile
              label="Nap / quiet"
              value={protectNap ? '1–3 pm' : 'Off'}
              dimmed={!protectNap}
              onPress={() => set({ protectNap: !protectNap })}
              a11y={protectNap ? 'Nap protected, 1 to 3 pm. Tap to turn off.' : 'Nap off. Tap to protect it.'}
            />
            <SettingTile
              label="Bedtime"
              value={bedtime}
              onPress={() => set({ bedtime: cycle(BEDTIME_OPTIONS, bedtime) })}
              a11y={`Bedtime ${bedtime}. Tap to change.`}
            />
            <SettingTile
              label="Max drive"
              value={driveLabel(maxDriveMin)}
              onPress={() => set({ maxDriveMin: cycle(MAX_DRIVE_OPTIONS, maxDriveMin) })}
              a11y={`Max drive ${driveLabel(maxDriveMin)}. Tap to change.`}
            />
          </View>
        </View>

        <View style={{ flex: 1, minHeight: 20 }} />

        {/* Trip-type shortcuts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          style={{ flexGrow: 0, marginBottom: 14 }}
        >
          {TRIP_TYPES.map((t) => {
            const active = tripType === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTripType(active ? null : t)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.typeChip, active && { backgroundColor: colors.ink, borderColor: colors.ink }]}
              >
                <T
                  style={{
                    fontFamily: fonts.bodySemi,
                    fontSize: 13,
                    color: active ? colors.white : colors.ink,
                  }}
                >
                  {t}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* CTA */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <Pressable
            onPress={() => router.push('/(plan)/agenda')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }]}
          >
            <T style={{ fontFamily: fonts.display, fontSize: 17, color: colors.white }}>Plan it with Mosey</T>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/trip/1')}
            accessibilityRole="link"
            hitSlop={8}
            style={styles.sampleLink}
          >
            <T style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.teal }}>
              Open your sample trip →
            </T>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function SettingTile({
  label,
  value,
  onPress,
  a11y,
  dimmed = false,
}: {
  label: string;
  value: string;
  onPress: () => void;
  a11y: string;
  dimmed?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [styles.settingTile, pressed && { opacity: 0.85 }]}
    >
      <T style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted }}>{label}</T>
      <T
        style={{
          fontFamily: fonts.bodyBold,
          fontSize: 15,
          marginTop: 2,
          color: dimmed ? colors.muted : colors.ink, // faint on white fails contrast
        }}
      >
        {value}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
  },
  avatar: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, letterSpacing: -0.5, color: colors.ink },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.6, color: colors.ink },
  searchCard: {
    marginHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: radius.cardLg,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  fieldRowInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fieldDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  suggestBox: { borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.card },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: MIN_TOUCH,
  },
  fieldLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldInput: { fontFamily: fonts.bodySemi, fontSize: 17, color: colors.ink, padding: 0 },
  fieldValue: { fontFamily: fonts.bodySemi, fontSize: 17, color: colors.ink },
  ageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 34 },
  ageChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.chip,
    backgroundColor: colors.tealSoft,
  },
  addChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.chip,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.faint,
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: colors.line,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.white,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  settingTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.chip,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    minHeight: 36,
    justifyContent: 'center',
  },
  cta: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.coral,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sampleLink: {
    alignSelf: 'center',
    marginTop: 12,
    minHeight: 32,
    justifyContent: 'center',
  },
});
