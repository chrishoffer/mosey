import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui';
import { getAccent, palette, radius, shadow, spacing } from '../theme/tokens';
import { countdownLabel, fmtDateRange } from '../lib/dates';
import type { Trip } from '../types/db';

interface Props {
  trip: Trip;
  travelerNames?: string[];
  /** Single live nudge surfaced on the active trip (the next thing to do). */
  liveNudge?: string | null;
  onPress?: () => void;
}

/** The color-blocked shelf card. Active trip = rich gradient hero with countdown +
 *  one live nudge. Planning = bold tint. Archived = soft tint with a memory hint. */
export function TripCard({ trip, travelerNames = [], liveNudge, onPress }: Props) {
  const accent = getAccent(trip.accent_color);
  const isActive = trip.status === 'active';
  const isArchived = trip.status === 'archived';

  const who =
    travelerNames.length > 0
      ? travelerNames.length <= 3
        ? travelerNames.join(' · ')
        : `${travelerNames.slice(0, 2).join(' · ')} +${travelerNames.length - 2}`
      : 'Just you';

  const body = (
    <>
      <View style={styles.topRow}>
        <Text variant="overline" color={isActive ? 'rgba(255,255,255,0.85)' : accent.deep}>
          {trip.trip_type.replace('_', ' ')}
        </Text>
        {isActive && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text variant="overline" color={palette.white}>
              Active
            </Text>
          </View>
        )}
      </View>

      <Text variant="title" color={isActive ? palette.white : accent.deep} style={styles.name}>
        {trip.name}
      </Text>
      <Text
        variant="label"
        color={isActive ? 'rgba(255,255,255,0.9)' : accent.deep}
        style={{ opacity: isActive ? 1 : 0.8 }}
      >
        {trip.destination} · {fmtDateRange(trip.start_date, trip.end_date)}
      </Text>
      <Text variant="caption" color={isActive ? 'rgba(255,255,255,0.85)' : accent.deep} style={styles.who}>
        {who}
      </Text>

      {isActive && (
        <View style={styles.countdownRow}>
          <Text variant="heading" color={palette.white}>
            {countdownLabel(trip.start_date, trip.end_date)}
          </Text>
        </View>
      )}

      {isActive && liveNudge ? (
        <View style={styles.nudge}>
          <Ionicons name="notifications" size={16} color={accent.deep} />
          <Text variant="caption" color={accent.deep} style={styles.nudgeText} numberOfLines={2}>
            {liveNudge}
          </Text>
        </View>
      ) : null}

      {isArchived && (
        <View style={styles.memoryRow}>
          <Ionicons name="bookmark" size={14} color={accent.deep} />
          <Text variant="caption" color={accent.deep}>
            Tap to revisit hits & misses
          </Text>
        </View>
      )}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${trip.name}, ${trip.destination}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}
    >
      {isActive ? (
        <LinearGradient
          colors={accent.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, shadow.hero]}
        >
          {body}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: isArchived ? accent.tintSoft : accent.tint },
            isArchived ? shadow.none : shadow.soft,
          ]}
        >
          {body}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.white,
  },
  name: {
    marginTop: spacing.sm,
  },
  who: {
    marginTop: spacing.xs,
  },
  countdownRow: {
    marginTop: spacing.md,
  },
  nudge: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  nudgeText: {
    flex: 1,
  },
  memoryRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
