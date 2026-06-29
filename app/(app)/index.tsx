import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Screen, Text } from '../../src/components/ui';
import { TripCard } from '../../src/components/TripCard';
import { Logo } from '../../src/components/Logo';
import { useProfile, useReadiness, useTimeline, useTrips, useTravelers } from '../../src/hooks';
import { useAuth } from '../../src/lib/auth';
import { accents, palette, spacing } from '../../src/theme/tokens';
import type { Trip } from '../../src/types/db';

export default function Shelf() {
  const router = useRouter();
  const { configured, session } = useAuth();
  const { data: profile } = useProfile();
  const trips = useTrips();

  const { active, planning, archived } = useMemo(() => groupTrips(trips.data ?? []), [trips.data]);
  const initial = (profile?.display_name || session?.user?.email || 'Y').trim().charAt(0).toUpperCase();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={trips.isRefetching} onRefresh={() => trips.refetch()} />}
      >
        <View style={styles.brandBar}>
          <View style={styles.wordmark}>
            <Logo size={32} />
            <Text variant="heading">Mosey</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: accents.marigold.base }]}>
            <Text variant="bodyStrong" color={accents.marigold.deep}>
              {initial}
            </Text>
          </View>
        </View>

        <View style={styles.greetBlock}>
          <Text variant="hero">
            Let’s <Text variant="hero" color={palette.coral}>mosey</Text>.
          </Text>
          <Text variant="label" style={{ marginTop: 2 }}>
            {subLine(!!active, planning.length, archived.length, profile?.display_name)}
          </Text>
        </View>

        {!configured && <ConfigNotice />}

        {trips.isLoading ? (
          <Card>
            <Text variant="body" color={palette.inkSoft}>
              Loading your trips…
            </Text>
          </Card>
        ) : trips.isError ? (
          <Card>
            <Text variant="bodyStrong">Couldn’t load trips</Text>
            <Text variant="caption" color={palette.inkSoft} style={{ marginTop: 4 }}>
              Pull to refresh, or check your connection.
            </Text>
          </Card>
        ) : (trips.data ?? []).length === 0 ? (
          <EmptyShelf onNew={() => router.push('/(app)/new-trip')} />
        ) : (
          <>
            {active && (
              <Section title="Up next">
                <ActiveTrip trip={active} onPress={() => router.push(`/(app)/trip/${active.id}`)} />
              </Section>
            )}

            {planning.length > 0 && (
              <Section title="Planning">
                {planning.map((t) => (
                  <TripCard key={t.id} trip={t} onPress={() => router.push(`/(app)/trip/${t.id}`)} />
                ))}
              </Section>
            )}

            {archived.length > 0 && (
              <Section title="In the books">
                {archived.map((t) => (
                  <TripCard key={t.id} trip={t} onPress={() => router.push(`/(app)/trip/${t.id}`)} />
                ))}
              </Section>
            )}

            <Button
              label="Plan a new trip"
              onPress={() => router.push('/(app)/new-trip')}
              icon={<Ionicons name="add" size={20} color={palette.white} />}
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

/** Active trip card enriched with travelers + the single soonest live nudge. */
function ActiveTrip({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const travelers = useTravelers(trip.id);
  const timeline = useTimeline(trip.id);
  const readiness = useReadiness(trip.id);
  const liveNudge = useMemo(() => {
    const now = Date.now();
    const upcoming = (timeline.data ?? [])
      .filter((e) => !e.is_done && e.notify_at && new Date(e.notify_at).getTime() >= now - 86_400_000)
      .sort((a, b) => new Date(a.notify_at!).getTime() - new Date(b.notify_at!).getTime());
    return upcoming[0]?.title ?? null;
  }, [timeline.data]);

  return (
    <TripCard
      trip={trip}
      travelerNames={(travelers.data ?? []).map((c) => c.name)}
      liveNudge={liveNudge}
      readiness={readiness.total > 0 ? readiness.overall : null}
      onPress={onPress}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="overline" color={palette.inkSoft} style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={{ gap: spacing.md }}>{children}</View>
    </View>
  );
}

function EmptyShelf({ onNew }: { onNew: () => void }) {
  return (
    <Card lift="soft" style={styles.empty}>
      <Text variant="title">Let’s plan your first trip</Text>
      <Text variant="body" color={palette.inkSoft} style={{ marginTop: spacing.sm }}>
        Tell Mosey who’s coming and where you’re headed. We’ll build the packing list, the
        getting-there kit, and a timeline that taps you at the right moments.
      </Text>
      <Button label="Start a trip" onPress={onNew} style={{ marginTop: spacing.lg }} />
    </Card>
  );
}

function ConfigNotice() {
  return (
    <Card style={styles.notice}>
      <Text variant="bodyStrong" color={palette.danger}>
        Connect Supabase to begin
      </Text>
      <Text variant="caption" color={palette.inkSoft} style={{ marginTop: 4 }}>
        Add your project URL and anon key to .env. Until then, trips can’t be saved.
      </Text>
    </Card>
  );
}

function groupTrips(trips: Trip[]) {
  const active = trips.find((t) => t.status === 'active') ?? null;
  const planning = trips.filter((t) => t.status === 'planning');
  const archived = trips.filter((t) => t.status === 'archived');
  return { active, planning, archived };
}

/** Playful one-liner under the greeting, summarizing the shelf (concept: "One on
 *  the horizon, two in the books."). */
function subLine(hasActive: boolean, planning: number, archived: number, name?: string | null): string {
  const horizon = (hasActive ? 1 : 0) + planning;
  const parts: string[] = [];
  if (horizon > 0) parts.push(`${horizon} on the horizon`);
  if (archived > 0) parts.push(`${archived} in the books`);
  if (parts.length === 0) {
    return name ? `Ready when you are, ${name}.` : 'Your trips, all in one calm place.';
  }
  const s = parts.join(', ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 },
  brandBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  greetBlock: { marginTop: -spacing.xs },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  empty: { padding: spacing.xl },
  notice: { backgroundColor: '#FBE7E2' },
});
