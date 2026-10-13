import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen, T } from '../../src/components/ui';
import { colors, fonts, MIN_TOUCH, radius } from '../../src/theme/tokens';
import { stays, type Stay } from '../../src/mock/data';
import { usePlanFlow } from '../../src/store/planFlow';

/* Plan step 3 — stays ranked by Kid-fit, each with a "why Mosey picked it" line.
   Mockup: design/v2-mockups/Results.dc.html. */

const TEAL_DEEP = '#085F56'; // kid-fit badge text, from the mockup

// Photo placeholder colors from the mockup (stand-ins until partner photos land).
const PHOTO_COLORS: Record<string, string> = { s1: '#2E5C7A', s2: '#6B8A5E', s3: '#8A6E5E' };

const FILTERS = ['Kids sleep separately', 'Indoor pool', 'Free breakfast', 'Walkable'];
const DEFAULT_FILTERS = ['Kids sleep separately', 'Indoor pool'];
const STAY_COUNT_LABEL = '38 stays'; // mock result count from the mockup

export default function StaysScreen() {
  const router = useRouter();
  const { destination, dates, adults, kidAges } = usePlanFlow();
  const ranked = useMemo(() => [...stays].sort((a, b) => b.kidFit - a.kidFit), []);
  const [activeFilters, setActiveFilters] = useState<string[]>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState(ranked[0]?.id ?? null);

  const toggleFilter = (f: string) =>
    setActiveFilters((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  // Short header forms: "Gatlinburg, Tennessee" → "Gatlinburg, TN"-ish; dates drop the nights suffix.
  const place = (destination || 'Gatlinburg, Tennessee').replace(', Tennessee', ', TN');
  const dateShort = (dates || 'Mar 27 – Apr 1').split(' · ')[0];
  const whoLine = `${dateShort} · ${adults} adults, ${kidAges.length} kids`;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(plan)/search'));

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Search summary header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Back to search"
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <View style={styles.summaryPill}>
            <T style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink }}>{place}</T>
            <T style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{whoLine}</T>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          style={{ marginTop: 12, flexGrow: 0 }}
        >
          {FILTERS.map((f) => {
            const on = activeFilters.includes(f);
            return (
              <Pressable
                key={f}
                onPress={() => toggleFilter(f)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.filterChip, on ? styles.filterOn : styles.filterOff]}
              >
                <T style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: on ? colors.white : colors.ink }}>
                  {f}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Count + sort */}
      <View style={styles.metaRow}>
        <T style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted }}>
          <T style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink }}>{STAY_COUNT_LABEL}</T>
          {' fit your crew'}
        </T>
        <T style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.teal }}>Best for your crew</T>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {ranked.map((stay, i) => (
          <StayCard
            key={stay.id}
            stay={stay}
            topPick={i === 0}
            selected={selectedId === stay.id}
            onPress={() => setSelectedId(stay.id)}
          />
        ))}
      </ScrollView>

      {/* Continue */}
      <View style={styles.footer}>
        <Button
          label="Continue to your trip"
          kind="primary"
          disabled={!selectedId}
          onPress={() => router.push('/trip/1')}
          style={{ height: 54, borderRadius: 16 }}
          textStyle={{ fontSize: 16 }}
        />
      </View>
    </Screen>
  );
}

function StayCard({
  stay,
  topPick,
  selected,
  onPress,
}: {
  stay: Stay;
  topPick: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const price = stay.perNight.split(' /')[0]; // "$236 / night" → "$236"
  const subline = stay.amenities.slice(0, 2).join(' · ');
  const why = `${stay.reasons[0]}. ${stay.distanceLabel}.`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${stay.name}, kid-fit ${stay.kidFit}, ${stay.perNight}`}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={[styles.photo, { height: topPick ? 132 : 110, backgroundColor: PHOTO_COLORS[stay.id] ?? colors.faint }]}>
        <Ionicons name="image-outline" size={18} color="rgba(255,255,255,0.85)" />
        {topPick && (
          <View style={styles.pickBadge}>
            <T style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink }}>Mosey's pick</T>
          </View>
        )}
        {selected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark-circle" size={24} color={colors.white} />
          </View>
        )}
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
          <T style={styles.stayName}>{stay.name}</T>
          <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
            <T style={{ fontFamily: fonts.bodyBold, fontSize: 17, color: colors.ink }}>{price}</T>
            <T style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>per night</T>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <View style={styles.kidFitBadge}>
            <T style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: TEAL_DEEP }}>Kid-fit {stay.kidFit}</T>
          </View>
          <T style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, flex: 1 }} numberOfLines={1}>
            {subline}
          </T>
        </View>
        <View style={styles.whyBox}>
          <T style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Why Mosey picked it
          </T>
          <T style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.ink, marginTop: 3 }}>
            {why}
          </T>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.card,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    backgroundColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPill: {
    flex: 1,
    backgroundColor: colors.ground,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.chip,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterOn: { backgroundColor: colors.ink },
  filterOff: { borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.card },
  metaRow: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: colors.teal },
  photo: {
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 12,
  },
  pickBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.chip,
    backgroundColor: colors.sun,
  },
  checkBadge: { position: 'absolute', top: 12, right: 12 },
  stayName: {
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 21,
    letterSpacing: -0.2,
    color: colors.ink,
    flex: 1,
  },
  kidFitBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.tealSoft,
  },
  whyBox: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.ground,
    borderRadius: 10,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
