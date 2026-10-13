import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Screen, T, TipStrip } from '../../../src/components/ui';
import { colors, fonts, MIN_TOUCH, radius, spacing } from '../../../src/theme/tokens';
import { planItems, trip, tripDays, type PlanItem } from '../../../src/mock/data';

// Mock-only extras for this screen (static phase) — see design/v2-mockups/Planner.dc.html.
const DAY_TIPS: Record<number, string> = {
  0: 'Leaving by 9 means the drive ends right at nap — Chase sleeps, you unpack.',
  1: 'The aquarium is quietest before 10, so I moved it up and kept 1–3 clear for naps.',
};

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

/** "9:00 AM" → "9:00" to match the mockup's slim time rail. */
function timeLabel(startTime: string): string {
  return startTime.replace(/\s?(AM|PM)$/i, '');
}

/** Six-dot drag grip, as drawn in the mockup. Dragging comes in a later phase. */
function GripDots() {
  return (
    <View style={styles.grip}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={{ flexDirection: 'row', gap: 4 }}>
          <View style={styles.gripDot} />
          <View style={styles.gripDot} />
        </View>
      ))}
    </View>
  );
}

export default function DaysScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const tripId = params.id ?? trip.id;

  const [dayIdx, setDayIdx] = useState(0);
  // Local reorder state: one array of items per day, seeded from the mock plan.
  const [itemsByDay, setItemsByDay] = useState<PlanItem[][]>(() =>
    tripDays.map((_, d) => planItems.filter((p) => p.day === d)),
  );
  const [reorderId, setReorderId] = useState<string | null>(null);

  const dayItems = itemsByDay[dayIdx] ?? [];

  const moveItem = (id: string, dir: -1 | 1) => {
    setItemsByDay((prev) => {
      const items = [...(prev[dayIdx] ?? [])];
      const from = items.findIndex((p) => p.id === id);
      if (from < 0) return prev;
      // Protected (locked) blocks stay put — hop over them.
      let to = from + dir;
      while (to >= 0 && to < items.length && items[to].locked) to += dir;
      if (to < 0 || to >= items.length) return prev;
      const [moved] = items.splice(from, 1);
      items.splice(to > from ? to - 1 : to, 0, moved);
      const next = [...prev];
      next[dayIdx] = items;
      return next;
    });
  };

  const selectDay = (idx: number) => {
    setDayIdx(idx);
    setReorderId(null);
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <T variant="title">Your days</T>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/trip/${tripId}/map`)}
          style={styles.mapPill}
        >
          <Ionicons name="map-outline" size={16} color={colors.ink} />
          <T style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>Map</T>
        </Pressable>
      </View>

      <View style={styles.dayTabs}>
        {tripDays.map((label, idx) => {
          const [dow, num] = label.split(' ');
          const active = idx === dayIdx;
          return (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => selectDay(idx)}
              style={[styles.dayTab, active && { backgroundColor: colors.ink }]}
            >
              <T style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: active ? colors.white : colors.muted }}>
                {dow}
              </T>
              <T style={{ fontFamily: fonts.bodyBold, fontSize: 17, color: active ? colors.white : colors.ink }}>
                {num}
              </T>
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {DAY_TIPS[dayIdx] ? (
          <TipStrip style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md }}>{DAY_TIPS[dayIdx]}</TipStrip>
        ) : null}

        {dayItems.length === 0 ? (
          <View style={styles.emptyDay}>
            <Ionicons name="calendar-outline" size={28} color={colors.faint} />
            <T variant="bodySemi" style={{ marginTop: spacing.sm }}>
              Nothing planned yet
            </T>
            <T variant="caption" style={{ textAlign: 'center', marginTop: 2 }}>
              Ask Mosey to sketch this day — it plans around naps, bedtime, and your drive cap.
            </T>
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
            {dayItems.map((item) => {
              const isNap = item.kind === 'nap';
              const selected = reorderId === item.id;
              return (
                <View key={item.id} style={styles.slotRow}>
                  <T style={styles.timeRail}>{timeLabel(item.startTime)}</T>

                  {isNap ? (
                    <View style={styles.napBlock}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="lock-closed" size={15} color={colors.muted} />
                        <T style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.muted }}>{item.title}</T>
                      </View>
                      <T variant="caption" style={{ marginTop: 3 }}>
                        {fmtDuration(item.durationMin)} · {item.note}
                      </T>
                    </View>
                  ) : (
                    <View style={[styles.itemCard, item.booked && styles.itemCardBooked]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <T style={{ fontFamily: fonts.bodyBold, fontSize: 15 }}>{item.title}</T>
                          <T variant="caption" style={{ marginTop: 1 }}>
                            {fmtDuration(item.durationMin)}
                            {item.placeName ? ` · ${item.placeName}` : ''}
                          </T>
                        </View>
                        {selected ? (
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Move ${item.title} earlier`}
                              onPress={() => moveItem(item.id, -1)}
                              style={styles.moveBtn}
                            >
                              <Ionicons name="chevron-up" size={20} color={colors.ink} />
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Move ${item.title} later`}
                              onPress={() => moveItem(item.id, 1)}
                              style={styles.moveBtn}
                            >
                              <Ionicons name="chevron-down" size={20} color={colors.ink} />
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Done moving"
                              onPress={() => setReorderId(null)}
                              style={[styles.moveBtn, { backgroundColor: colors.tealSoft }]}
                            >
                              <Ionicons name="checkmark" size={20} color={colors.teal} />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Reorder ${item.title}`}
                            onPress={() => setReorderId(item.id)}
                            style={styles.gripBtn}
                          >
                            <GripDots />
                          </Pressable>
                        )}
                      </View>

                      {item.note ? (
                        <T variant="caption" color={colors.ink} style={{ marginTop: 6, opacity: 0.8 }}>
                          {item.note}
                        </T>
                      ) : null}

                      {item.agesOk || item.booked ? (
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                          {item.agesOk ? (
                            <View style={[styles.miniChip, { backgroundColor: colors.tealSoft }]}>
                              <T style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: '#085F56' }}>{item.agesOk}</T>
                            </View>
                          ) : null}
                          {item.booked ? (
                            <View style={[styles.miniChip, { backgroundColor: '#EEF1F6' }]}>
                              <T style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted }}>
                                Booked{item.partner ? ` · ${item.partner}` : ''}
                              </T>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <Button
          label="Looks good · save the trip"
          kind="ink"
          onPress={() => router.push(`/trip/${tripId}`)}
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.xl, minHeight: 52 }}
          textStyle={{ fontSize: 16 }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 10,
  },
  mapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: MIN_TOUCH,
    paddingHorizontal: 14,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.card,
  },
  dayTabs: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  dayTab: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'stretch',
  },
  timeRail: {
    width: 44,
    paddingTop: 12,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.muted,
  },
  itemCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
  },
  itemCardBooked: {
    borderLeftWidth: 4,
    borderLeftColor: colors.teal,
  },
  napBlock: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: colors.line, // protected block: neutral fill + dashed faint border (Planner.dc.html)
    borderWidth: 1.5,
    borderColor: colors.faint,
    borderStyle: 'dashed',
  },
  grip: {
    gap: 4,
  },
  gripDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: colors.faint,
  },
  gripBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  moveBtn: {
    width: 40,
    height: MIN_TOUCH,
    borderRadius: 10,
    backgroundColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  emptyDay: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.xxl,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
});
