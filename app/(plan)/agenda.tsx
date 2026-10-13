import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen, T } from '../../src/components/ui';
import { colors, fonts, MIN_TOUCH, radius } from '../../src/theme/tokens';
import { usePlanFlow } from '../../src/store/planFlow';

/* Plan step 2 — multi-select activity tiles. Mockup: design/v2-mockups/Agenda.dc.html. */

type Tile = { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] };

const SECTIONS: { title: string; tiles: Tile[] }[] = [
  {
    title: 'Water & outdoors',
    tiles: [
      { label: 'Pool', icon: 'water-outline' },
      { label: 'Hiking', icon: 'trail-sign-outline' },
      { label: 'Beach', icon: 'sunny-outline' },
      { label: 'Snow', icon: 'snow-outline' },
    ],
  },
  {
    title: 'Family fun',
    tiles: [
      { label: 'Aquarium', icon: 'fish-outline' },
      { label: 'Theme park', icon: 'balloon-outline' },
      { label: 'Shows', icon: 'musical-notes-outline' },
      { label: 'Tournament', icon: 'trophy-outline' },
    ],
  },
];

// The mockup opens with these already picked (matches the sample trip's agenda).
const DEFAULT_PICKS = ['Pool', 'Hiking', 'Aquarium', 'Shows'];

const STEP = 2;
const TOTAL_STEPS = 4;

export default function AgendaScreen() {
  const router = useRouter();
  const { agenda, toggleAgenda, set } = usePlanFlow();

  useEffect(() => {
    if (agenda.length === 0) set({ agenda: DEFAULT_PICKS });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(plan)/search'));

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Close + step */}
      <View style={styles.topRow}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={20} color={colors.ink} />
        </Pressable>
        <T style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.muted }}>
          Step {STEP} of {TOTAL_STEPS}
        </T>
        <View style={{ width: MIN_TOUCH }} />
      </View>

      {/* Progress bars */}
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View
            key={i}
            style={[styles.progressBar, { backgroundColor: i < STEP ? colors.ink : colors.lineStrong }]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 }}>
          <T style={styles.h1}>What's on the agenda?</T>
          <T variant="body" color={colors.muted} style={{ marginTop: 6 }}>
            Pick all that apply. I'll plan the days and the packing list around them.
          </T>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 14 }}>
          {SECTIONS.map((section) => (
            <View key={section.title}>
              <T variant="section" style={{ fontSize: 12, marginBottom: 8 }}>
                {section.title}
              </T>
              <View style={styles.tileGrid}>
                {section.tiles.map((tile) => {
                  const selected = agenda.includes(tile.label);
                  return (
                    <Pressable
                      key={tile.label}
                      onPress={() => toggleAgenda(tile.label)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={tile.label}
                      style={[styles.tile, selected ? styles.tileOn : styles.tileOff]}
                    >
                      <Ionicons
                        name={tile.icon}
                        size={24}
                        color={selected ? colors.sun : colors.muted}
                      />
                      <T
                        style={{
                          fontFamily: selected ? fonts.bodyBold : fonts.bodySemi,
                          fontSize: 13,
                          color: selected ? colors.white : colors.ink,
                        }}
                        numberOfLines={1}
                      >
                        {tile.label}
                      </T>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, minHeight: 20 }} />

        {/* Back / Next */}
        <View style={styles.footerRow}>
          <Button
            label="Back"
            kind="ghost"
            onPress={goBack}
            style={styles.footerBtn}
            textStyle={styles.footerBtnText}
          />
          <Button
            label="Next"
            kind="primary"
            onPress={() => router.push('/(plan)/stays')}
            style={styles.footerBtn}
            textStyle={[styles.footerBtnText, { color: colors.white }]}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    paddingTop: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  h1: { fontFamily: fonts.display, fontSize: 26, lineHeight: 31, letterSpacing: -0.5, color: colors.ink },
  tileGrid: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    height: 78,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  tileOn: { backgroundColor: colors.ink },
  tileOff: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  footerBtn: { flex: 1, height: 54, borderRadius: 16 },
  footerBtnText: { fontSize: 16, fontFamily: fonts.bodyBold },
});
