import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Screen, T } from '../../../src/components/ui';
import { colors, fonts, MIN_TOUCH, radius, spacing } from '../../../src/theme/tokens';
import { exploreResults, trip, type ExploreResult } from '../../../src/mock/data';

/* Explore — matches design/v2-mockups/Explore.dc.html.
   Natural-language search (decorative), filter chips, kid-fit result cards with
   the "Fits your Fri 3:15 opening" note and a local-state "Add to day" button.
   All interactivity is local; results come from src/mock/data.ts. */

const FILTER_CHIPS = ['Ages 4–9', 'Indoors', 'Under 2 hrs', 'Free'] as const;
const CATEGORY_TILES = ['All', 'Outdoors', 'Food', 'Shows'] as const;
type CategoryTile = (typeof CATEGORY_TILES)[number];

// Photo placeholder colors, same family as the mockup blocks.
const PHOTO_COLORS = ['#2E5C7A', '#8A6A4E', '#6B8A5E', '#7A5E8A'];

function matchesCategory(r: ExploreResult, c: CategoryTile): boolean {
  if (c === 'All') return true;
  if (c === 'Outdoors') return !r.indoor;
  return false; // no Food / Shows results in the mock set yet
}

export default function ExploreScreen() {
  const [query, setQuery] = useState('something indoors after nap time');
  // "Ages 4–9" reflects the kids on this trip and starts selected, as in the mockup.
  const [chips, setChips] = useState<string[]>(['Ages 4–9']);
  const [category, setCategory] = useState<CategoryTile>('All');
  const [added, setAdded] = useState<string[]>([]);

  const toggleChip = (c: string) =>
    setChips((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const indoorsOnly = chips.includes('Indoors');
  const results = exploreResults
    .filter((r) => matchesCategory(r, category))
    .filter((r) => (indoorsOnly ? r.indoor : true))
    .sort((a, b) => b.kidFit - a.kidFit);

  return (
    <Screen>
      {/* Header: title + natural-language search + filter chips */}
      <View style={styles.header}>
        <T variant="title" style={{ marginBottom: 12, marginLeft: 4 }}>
          Explore {trip.destination}
        </T>
        <View style={styles.searchPill}>
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search things to do"
            placeholder="Ask for anything"
            placeholderTextColor={colors.faint}
            style={styles.searchInput}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
          {FILTER_CHIPS.map((c) => {
            const on = chips.includes(c);
            return (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => toggleChip(c)}
                style={[styles.filterChip, on ? styles.filterChipOn : styles.filterChipOff]}
              >
                <T style={[styles.filterChipLabel, { color: on ? colors.white : colors.ink }]}>{c}</T>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Category tiles */}
        <View style={styles.tileGrid}>
          {CATEGORY_TILES.map((c) => {
            const on = category === c;
            return (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setCategory(c)}
                style={[styles.tile, on && styles.tileOn]}
              >
                <T style={[styles.tileLabel, on && styles.tileLabelOn]}>{c}</T>
              </Pressable>
            );
          })}
        </View>

        {/* Fit line */}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: 10, paddingBottom: 6 }}>
          <T style={{ fontSize: 14, color: colors.muted, fontFamily: fonts.body }}>
            <T style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink }}>Fits your Fri 3:15 opening</T>
            {' · sorted by kid-fit'}
          </T>
        </View>

        {/* Result cards */}
        <View style={styles.results}>
          {results.map((r, i) => (
            <ResultCard
              key={r.id}
              result={r}
              photoColor={PHOTO_COLORS[i % PHOTO_COLORS.length]}
              added={added.includes(r.id)}
              onAdd={() => setAdded((prev) => [...prev, r.id])}
            />
          ))}
          {results.length === 0 ? (
            <Card style={{ padding: spacing.lg }}>
              <T variant="caption">No kid-fit matches for {category.toLowerCase()} yet — Mosey keeps looking. Try All.</T>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function ResultCard({
  result,
  photoColor,
  added,
  onAdd,
}: {
  result: ExploreResult;
  photoColor: string;
  added: boolean;
  onAdd: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.photo, { backgroundColor: photoColor }]}>
        <T style={styles.photoLabel}>[PHOTO]</T>
      </View>
      <View style={styles.cardBody}>
        <T style={styles.cardTitle}>{result.title}</T>
        <T variant="caption">
          {result.indoor ? 'Indoors' : 'Outdoors'} · {result.durationLabel} · {result.distanceLabel}
        </T>
        <View style={styles.badgeRow}>
          <View style={styles.kidFitBadge}>
            <T style={styles.kidFitLabel}>Kid-fit {result.kidFit}</T>
          </View>
          <T style={{ fontSize: 12, color: colors.muted, fontFamily: fonts.bodyMedium }}>{result.priceLabel}</T>
        </View>
        {result.fitNote ? <T style={styles.fitNote}>{result.fitNote}</T> : null}
        {added ? (
          <View style={[styles.addBtn, { backgroundColor: colors.teal }]}>
            <T style={styles.addLabel}>Added ✓</T>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onAdd}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.88 }]}
          >
            <T style={styles.addLabel}>+ Add to Friday</T>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.card,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  searchPill: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.button,
    backgroundColor: colors.ground,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink, paddingVertical: 0 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.chip,
    minHeight: 33,
    justifyContent: 'center',
  },
  filterChipOn: { backgroundColor: colors.ink },
  filterChipOff: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong },
  filterChipLabel: { fontFamily: fonts.bodySemi, fontSize: 13 },
  tileGrid: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 4,
  },
  tile: {
    flex: 1,
    height: 64,
    borderRadius: radius.button,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOn: { borderWidth: 2, borderColor: colors.teal },
  tileLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
  tileLabelOn: { fontFamily: fonts.bodyBold, color: colors.ink },
  results: { paddingHorizontal: spacing.lg, paddingTop: 6, gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: colors.ink,
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  photo: { width: 108, flexShrink: 0, justifyContent: 'flex-end', padding: 8 },
  photoLabel: { color: colors.white, fontSize: 11, opacity: 0.85 },
  cardBody: { flex: 1, paddingVertical: 12, paddingHorizontal: 14, gap: 6 },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 19, color: colors.ink },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kidFitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.tealSoft,
  },
  kidFitLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#085F56' },
  fitNote: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.teal },
  addBtn: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.white },
});
