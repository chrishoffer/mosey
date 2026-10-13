import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, InkHeader, Screen, SectionLabel, T, Wordmark } from '../../../src/components/ui';
import { colors, fonts, MIN_TOUCH, radius, spacing } from '../../../src/theme/tokens';
import { todos as todosSeed, travelers, trip } from '../../../src/mock/data';

// Mock-only extras for this screen (static phase) — see design/v2-mockups/TripHome.dc.html.
const DATE_RANGE_LABEL = 'Mar 27 – Apr 1';

const ADD_ONS: {
  id: string;
  title: string;
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}[] = [
  { id: 'a1', title: 'Tickets', caption: 'Shows, parks, coaster', icon: 'ticket-outline', iconColor: '#8A5A00', iconBg: colors.sunSoft },
  { id: 'a2', title: 'Dining', caption: 'Tables for 5, early seats', icon: 'restaurant-outline', iconColor: '#085F56', iconBg: colors.tealSoft },
  { id: 'a3', title: 'Rainy-day plan', caption: 'Ready if it pours', icon: 'rainy-outline', iconColor: '#2E5C7A', iconBg: '#E8EEF8' },
  { id: 'a4', title: 'Date night', caption: 'Vetted sitters nearby', icon: 'heart-outline', iconColor: colors.coral, iconBg: '#FBE7E2' },
];

export default function TripHomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const tripId = params.id ?? trip.id;

  const [todos, setTodos] = useState(todosSeed.map((t) => ({ ...t })));
  const doneCount = todos.filter((t) => t.done).length;

  const toggleTodo = (id: string) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <InkHeader>
          <View style={styles.headerRow}>
            <Wordmark size={20} />
            <View style={styles.travelersPill}>
              <T variant="caption" color={colors.white} style={{ fontFamily: fonts.bodySemi }}>
                {travelers.length} travelers
              </T>
            </View>
          </View>

          <T variant="section" color={colors.sun} style={{ marginTop: 26, letterSpacing: 0.8 }}>
            {trip.title}
          </T>
          <View style={styles.countdownRow}>
            <T style={styles.countdownNumber}>{trip.daysUntil}</T>
            <T color={colors.white} style={{ fontFamily: fonts.bodySemi, fontSize: 18, lineHeight: 24 }}>
              days to {trip.destination}
            </T>
          </View>
          <T color={colors.white} style={{ fontFamily: fonts.body, fontSize: 14, opacity: 0.85, marginTop: 6 }}>
            {DATE_RANGE_LABEL} · {trip.driveLabel}
          </T>

          <View style={styles.segmentRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/trip/${tripId}/book`)}
              style={[styles.segment, styles.segmentActive]}
            >
              <T style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink }}>Get ready</T>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/trip/${tripId}/days`)}
              style={styles.segment}
            >
              <T style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white }}>Days</T>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/trip/${tripId}/ask`)}
              style={styles.segment}
            >
              <T style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white }}>Ask Mosey</T>
            </Pressable>
          </View>
        </InkHeader>

        <SectionLabel style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.sm }}>
          To do before you go · {doneCount} of {todos.length}
        </SectionLabel>
        <Card style={{ marginHorizontal: spacing.lg }}>
          {todos.map((todo, i) => (
            <Pressable
              key={todo.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: todo.done }}
              onPress={() => toggleTodo(todo.id)}
              style={[styles.todoRow, i < todos.length - 1 && styles.todoDivider]}
            >
              <Ionicons
                name={todo.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={todo.done ? colors.teal : colors.faint}
              />
              <View style={{ flex: 1 }}>
                <T
                  style={
                    todo.done
                      ? { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textDecorationLine: 'line-through' }
                      : { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink }
                  }
                >
                  {todo.label}
                </T>
                {!todo.done && todo.detail ? (
                  <T variant="caption" style={{ marginTop: 1 }}>
                    {todo.detail}
                  </T>
                ) : null}
              </View>
            </Pressable>
          ))}
        </Card>

        <SectionLabel style={{ paddingHorizontal: spacing.xl, paddingTop: 22, paddingBottom: 10 }}>
          Add to your trip
        </SectionLabel>
        <View style={styles.tileGrid}>
          {ADD_ONS.map((tile) => (
            <Card key={tile.id} style={styles.tile}>
              <View style={[styles.tileIcon, { backgroundColor: tile.iconBg }]}>
                <Ionicons name={tile.icon} size={22} color={tile.iconColor} />
              </View>
              <T style={{ fontFamily: fonts.bodyBold, fontSize: 15, marginTop: 10 }}>{tile.title}</T>
              <T variant="caption" style={{ marginTop: 1 }}>
                {tile.caption}
              </T>
            </Card>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/trip/${tripId}/map`)}
          style={styles.mapLink}
        >
          <View style={[styles.tileIcon, { backgroundColor: colors.tealSoft }]}>
            <Ionicons name="map-outline" size={22} color={colors.teal} />
          </View>
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: fonts.bodyBold, fontSize: 15 }}>Trip map</T>
            <T variant="caption">Every stop, pinned by day</T>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.faint} />
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  travelersPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.chip,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 6,
  },
  countdownNumber: {
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 58,
    letterSpacing: -1.5,
    color: colors.white,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.white,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minHeight: MIN_TOUCH,
  },
  todoDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    padding: 14,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: 10,
    padding: 14,
    minHeight: MIN_TOUCH,
    backgroundColor: colors.card,
    borderRadius: radius.card,
  },
});
