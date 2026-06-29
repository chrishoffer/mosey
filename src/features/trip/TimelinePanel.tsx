import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Text } from '../../components/ui';
import { useSetEventDone, useTimeline } from '../../hooks';
import { getAccent, palette, radius, spacing } from '../../theme/tokens';
import { daysUntil, fmtDate } from '../../lib/dates';
import type { Trip, TimelineEvent } from '../../types/db';

/** The timeline spine (§8 signature): a vertical line with milestone/nudge nodes,
 *  a pulsing "now" marker, and the single next live nudge highlighted. */
export function TimelinePanel({ trip }: { trip: Trip }) {
  const accent = getAccent(trip.accent_color);
  const timeline = useTimeline(trip.id);
  const setDone = useSetEventDone(trip.id);

  const events = timeline.data ?? [];
  const liveId = nextLiveEventId(events);

  if (timeline.isLoading) {
    return <PanelMessage text="Loading your timeline…" />;
  }
  if (timeline.isError) {
    return <PanelMessage text="Couldn’t load the timeline. Pull to refresh." />;
  }
  if (events.length === 0) {
    return <PanelMessage text="No timeline yet for this trip." />;
  }

  return (
    <View style={styles.wrap}>
      <Text variant="caption" color={palette.inkSoft} style={styles.intro}>
        Mosey will tap you at each of these moments — you don’t have to remember them.
      </Text>
      {events.map((ev, i) => (
        <SpineRow
          key={ev.id}
          event={ev}
          accent={accent.base}
          deep={accent.deep}
          isLive={ev.id === liveId}
          isLast={i === events.length - 1}
          onToggle={() => setDone.mutate({ id: ev.id, is_done: !ev.is_done })}
        />
      ))}
    </View>
  );
}

function SpineRow({
  event,
  accent,
  deep,
  isLive,
  isLast,
  onToggle,
}: {
  event: TimelineEvent;
  accent: string;
  deep: string;
  isLive: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  const d = event.notify_at ? daysUntil(event.notify_at) : null;
  const when = event.notify_at ? fmtDate(event.notify_at) : `${event.lead_days}d before`;
  const past = d !== null && d < 0;

  return (
    <View style={styles.row}>
      <View style={styles.spineCol}>
        <Node done={event.is_done} live={isLive} accent={accent} milestone={event.kind === 'milestone'} />
        {!isLast && <View style={[styles.line, { backgroundColor: past ? accent : palette.line }]} />}
      </View>

      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: event.is_done }}
        accessibilityLabel={`${event.title}, ${event.is_done ? 'done' : 'not done'}`}
        style={styles.bodyPress}
      >
        <Card lift={isLive ? 'hero' : 'none'} style={[styles.eventCard, isLive && { borderColor: accent, borderWidth: 1.5 }]}>
          <View style={styles.eventHead}>
            <Text variant="overline" color={isLive ? deep : palette.inkSoft}>
              {when}
              {isLive ? ' · next up' : ''}
            </Text>
            <Ionicons
              name={event.is_done ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={event.is_done ? accent : palette.inkSoft}
            />
          </View>
          <Text variant="subtitle" color={event.is_done ? palette.inkSoft : palette.ink} style={event.is_done && styles.struck}>
            {event.title}
          </Text>
          {event.body ? (
            <Text variant="body" color={palette.inkSoft} style={{ marginTop: 2 }}>
              {event.body}
            </Text>
          ) : null}
        </Card>
      </Pressable>
    </View>
  );
}

function Node({
  done,
  live,
  accent,
  milestone,
}: {
  done: boolean;
  live: boolean;
  accent: string;
  milestone: boolean;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (!live || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [live, reduceMotion, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  const fill = done || live ? accent : palette.card;

  return (
    <View style={styles.nodeWrap}>
      {live && !reduceMotion && (
        <Animated.View style={[styles.pulse, { backgroundColor: accent, transform: [{ scale }], opacity }]} />
      )}
      <View
        style={[
          milestone ? styles.nodeMilestone : styles.nodeNudge,
          { backgroundColor: fill, borderColor: accent },
        ]}
      />
    </View>
  );
}

function PanelMessage({ text }: { text: string }) {
  return (
    <View style={styles.wrap}>
      <Card lift="none">
        <Text variant="body" color={palette.inkSoft}>
          {text}
        </Text>
      </Card>
    </View>
  );
}

/** The soonest future, not-done event — the single "live" highlight. */
function nextLiveEventId(events: TimelineEvent[]): string | null {
  const now = Date.now() - 86_400_000; // include today
  const upcoming = events
    .filter((e) => !e.is_done && e.notify_at && new Date(e.notify_at).getTime() >= now)
    .sort((a, b) => new Date(a.notify_at!).getTime() - new Date(b.notify_at!).getTime());
  return upcoming[0]?.id ?? null;
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingBottom: spacing.x2 },
  intro: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  spineCol: { width: 28, alignItems: 'center' },
  nodeWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  pulse: { position: 'absolute', width: 16, height: 16, borderRadius: 8 },
  nodeMilestone: { width: 18, height: 18, borderRadius: 5, borderWidth: 2, transform: [{ rotate: '45deg' }] },
  nodeNudge: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  line: { width: 2, flex: 1, marginTop: 2 },
  bodyPress: { flex: 1, marginBottom: spacing.md },
  eventCard: { backgroundColor: palette.card, gap: 2 },
  eventHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  struck: { textDecorationLine: 'line-through' },
});
