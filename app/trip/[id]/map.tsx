import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, T } from '../../../src/components/ui';
import { colors, fonts, MIN_TOUCH, spacing } from '../../../src/theme/tokens';

/* Static map placeholder (no react-native-maps until a later phase).
   Road/water shapes and pin positions follow design/v2-mockups/Map.dc.html,
   drawn against the 390x430 reference frame. Coordinates are mock constants. */

const FRAME_W = 390;
const MAP_H = 430;

// Home base — the suite (mock coordinates near downtown Gatlinburg).
const SUITE = { lat: 35.7236, lng: -83.5133 };

interface Stop {
  id: string;
  num: number;
  title: string;
  caption: string;
  lat: number;
  lng: number;
  /** Apple Maps dirflg — 'd' drive, 'w' walk (brief §7: walk when under ~10 min on foot). */
  dirflg: 'd' | 'w';
  /** Pin center on the 390x430 mockup frame. */
  cx: number;
  cy: number;
}

const STOPS: Stop[] = [
  {
    id: 'stop1',
    num: 1,
    title: 'Aquarium',
    caption: '9:15 · 6 min from the suite · parking garage',
    lat: 35.7122,
    lng: -83.5202,
    dirflg: 'd',
    cx: 207,
    cy: 167,
  },
  {
    id: 'stop2',
    num: 2,
    title: 'Pancake house',
    caption: '11:45 · 4 min walk from stop 1',
    lat: 35.7111,
    lng: -83.5155,
    dirflg: 'w',
    cx: 253,
    cy: 251,
  },
  {
    id: 'stop3',
    num: 3,
    title: 'Dinner + early night',
    caption: '5:30 · 8 min back to the suite',
    lat: 35.7169,
    lng: -83.5241,
    dirflg: 'd',
    cx: 177,
    cy: 301,
  },
];

const SUITE_PIN = { cx: 120, cy: 205 };
const YOU_DOT = { cx: 309, cy: 339 };

/** Apple Maps single-stop directions (brief §7). */
function openDirections(stop: Stop) {
  Linking.openURL(`http://maps.apple.com/?daddr=${stop.lat},${stop.lng}&dirflg=${stop.dirflg}`);
}

/** Whole-day route — Google Maps multi-stop pattern (brief §7). */
function openRoute() {
  const last = STOPS[STOPS.length - 1];
  const waypoints = STOPS.slice(0, -1)
    .map((s) => `${s.lat},${s.lng}`)
    .join('|');
  Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${last.lat},${last.lng}&travelmode=driving&waypoints=${encodeURIComponent(waypoints)}`,
  );
}

const pct = (x: number) => `${(x / FRAME_W) * 100}%` as const;

export default function MapScreen() {
  const router = useRouter();
  const [scope, setScope] = useState<'day' | 'trip'>('day');
  const [selectedId, setSelectedId] = useState<string>(STOPS[0].id);

  return (
    <Screen>
      <View style={styles.mapArea}>
        <Svg width="100%" height={MAP_H} viewBox={`0 0 ${FRAME_W} ${MAP_H}`} preserveAspectRatio="none">
          {/* river */}
          <Path
            d="M-10 300 C 80 260, 140 330, 220 280 S 330 210, 400 240"
            fill="none"
            stroke="#B9D3E6"
            strokeWidth={18}
            strokeLinecap="round"
          />
          {/* roads */}
          <Path d="M40 -10 L 120 440" stroke="#FFFFFF" strokeWidth={10} />
          <Path d="M-10 150 L 400 120" stroke="#FFFFFF" strokeWidth={10} />
          <Path d="M260 -10 C 240 120, 300 220, 260 440" fill="none" stroke="#FFFFFF" strokeWidth={8} />
          <Path d="M0 400 L 400 360" stroke="#FFFFFF" strokeWidth={6} />
          {/* parks */}
          <Ellipse cx={330} cy={60} rx={70} ry={45} fill="#CFDDCB" />
          <Ellipse cx={40} cy={380} rx={60} ry={40} fill="#CFDDCB" />
          {/* day route */}
          <Path
            d="M120 205 L 205 168 L 250 250 L 175 300"
            fill="none"
            stroke={colors.ink}
            strokeWidth={3}
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
        </Svg>

        {/* home-base pin */}
        <View style={[styles.pinWrap, { left: pct(SUITE_PIN.cx), top: SUITE_PIN.cy - 22 }]}>
          <View style={styles.suitePin}>
            <T style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.white }}>H</T>
          </View>
        </View>

        {/* numbered stop pins */}
        {STOPS.map((stop) => {
          const isSelected = stop.id === selectedId;
          return (
            <Pressable
              key={stop.id}
              accessibilityRole="button"
              accessibilityLabel={`Stop ${stop.num}: ${stop.title}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => setSelectedId(stop.id)}
              style={[styles.pinWrap, { left: pct(stop.cx), top: stop.cy - 22 }]}
            >
              <View
                style={[
                  styles.stopPin,
                  isSelected && { backgroundColor: colors.ink, transform: [{ scale: 1.12 }] },
                ]}
              >
                <T style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.white }}>{stop.num}</T>
              </View>
            </Pressable>
          );
        })}

        {/* current location dot */}
        <View style={[styles.youHalo, { left: pct(YOU_DOT.cx), top: YOU_DOT.cy - 17 }]}>
          <View style={styles.youDot} />
        </View>

        {/* top overlay: back + scope chips */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to your days"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: scope === 'day' }}
            onPress={() => setScope('day')}
            style={[styles.scopeChip, scope === 'day' && styles.scopeChipActive]}
          >
            <T style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: scope === 'day' ? colors.white : colors.ink }}>
              Fri 28
            </T>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: scope === 'trip' }}
            onPress={() => setScope('trip')}
            style={[styles.scopeChip, scope === 'trip' && styles.scopeChipActive]}
          >
            <T style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: scope === 'trip' ? colors.white : colors.ink }}>
              Whole trip
            </T>
          </Pressable>
        </View>
      </View>

      {/* bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: fonts.display, fontSize: 18, letterSpacing: -0.3 }}>
              {scope === 'day' ? "Friday's stops" : 'The whole trip'}
            </T>
            <T variant="caption">
              {scope === 'day' ? '3 stops · 22 min of driving total' : '3 stops so far · more as you plan days'}
            </T>
          </View>
          <Pressable accessibilityRole="button" onPress={openRoute} style={styles.routeBtn}>
            <Ionicons name="map-outline" size={16} color={colors.ink} />
            <T style={{ fontFamily: fonts.bodyBold, fontSize: 13 }}>Open route in Maps</T>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {STOPS.map((stop) => {
            const isSelected = stop.id === selectedId;
            return (
              <Pressable
                key={stop.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelectedId(stop.id)}
                style={[styles.stopRow, isSelected && { backgroundColor: colors.ground, borderRadius: 14 }]}
              >
                <View style={[styles.rowBadge, isSelected && { backgroundColor: colors.ink }]}>
                  <T style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.white }}>{stop.num}</T>
                </View>
                <View style={{ flex: 1 }}>
                  <T style={{ fontFamily: fonts.bodyBold, fontSize: 15 }}>{stop.title}</T>
                  <T variant="caption">{stop.caption}</T>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Directions to ${stop.title}`}
                  onPress={() => openDirections(stop)}
                  style={styles.directionsBtn}
                >
                  <Ionicons name="navigate" size={20} color={colors.white} />
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>

        <T variant="caption" style={{ textAlign: 'center', paddingVertical: spacing.md }}>
          Directions open in Apple Maps or Google Maps, your pick
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapArea: {
    height: MAP_H,
    backgroundColor: '#E4ECE3',
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: 18,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  scopeChip: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  scopeChipActive: {
    backgroundColor: colors.ink,
  },
  pinWrap: {
    position: 'absolute',
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    marginLeft: -MIN_TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suitePin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.coral,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  youHalo: {
    position: 'absolute',
    width: 34,
    height: 34,
    marginLeft: -17,
    borderRadius: 17,
    backgroundColor: 'rgba(47,128,237,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  youDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2F80ED',
    borderWidth: 3,
    borderColor: colors.white,
  },
  sheet: {
    flex: 1,
    marginTop: -24,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.lineStrong,
    alignSelf: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: spacing.md,
  },
  routeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: MIN_TOUCH,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  rowBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: 12,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
