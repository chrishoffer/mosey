import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, InkHeader, Screen, SectionLabel, T, Wordmark } from '../src/components/ui';
import { useSession } from '../src/store/session';
import { useTrips } from '../src/store/trips';
import { useEntitlements } from '../src/store/entitlements';
import { canCreateAnotherTrip, FREE_TRIP_LIMIT, PLANS } from '../src/config/plans';
import { kidsLine } from '../src/mock/data';
import { colors, fonts, radius, spacing } from '../src/theme/tokens';

/** Home = the dashboard: every trip, start a new one, and a little inspiration.
 *  A trip is a place you GO from here — not the app's center of gravity. */
export default function HomeScreen() {
  const router = useRouter();
  const { name, signOut } = useSession();
  const trips = useTrips((s) => s.trips);
  const plan = useEntitlements((s) => s.plan);
  const planName = PLANS.find((p) => p.id === plan)?.name ?? 'Free';

  function startNewTrip() {
    if (!canCreateAnotherTrip(plan, trips.length)) {
      router.push('/paywall');
      return;
    }
    router.push('/(plan)/search');
  }

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <InkHeader style={styles.header}>
          <View style={styles.topRow}>
            <Wordmark size={22} />
            <Pressable
              onPress={() => router.push('/paywall')}
              style={styles.planPill}
              accessibilityRole="button"
              accessibilityLabel={`Current plan: ${planName}. See plans.`}
            >
              <Ionicons name={plan === 'free' ? 'sparkles-outline' : 'sparkles'} size={13} color={colors.sun} />
              <T variant="caption" color={colors.white}>
                {planName}
              </T>
            </Pressable>
          </View>
          <T variant="display" color={colors.white} style={{ marginTop: 22 }}>
            Where to next{name ? `, ${name}` : ''}?
          </T>
          <T variant="body" color="rgba(255,255,255,0.85)" style={{ marginTop: 4 }}>
            {kidsLine} · Mosey plans around them.
          </T>
          <Button label="Plan a new trip" onPress={startNewTrip} style={{ marginTop: spacing.xl }} />
        </InkHeader>

        <SectionLabel style={styles.sectionLabel}>Your trips</SectionLabel>
        <View style={styles.tripList}>
          {trips.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => router.push(`/trip/${t.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open trip ${t.title}`}
            >
              <Card style={styles.tripCard}>
                <View style={{ flex: 1, gap: 2 }}>
                  <T variant="heading">{t.title}</T>
                  <T variant="caption">
                    {t.destination} · {t.driveLabel}
                  </T>
                </View>
                <View style={[styles.daysChip, t.daysUntil < 0 && { backgroundColor: colors.sunSoft }]}>
                  {t.daysUntil >= 0 ? (
                    <>
                      <T style={styles.daysNum}>{t.daysUntil}</T>
                      <T variant="caption" color={colors.teal}>
                        days
                      </T>
                    </>
                  ) : (
                    <T variant="caption" color="#8A5A00">
                      Planning
                    </T>
                  )}
                </View>
              </Card>
            </Pressable>
          ))}
          {plan === 'free' && trips.length >= FREE_TRIP_LIMIT && (
            <Pressable onPress={() => router.push('/paywall')} accessibilityRole="button">
              <Card style={styles.upsell}>
                <Ionicons name="lock-closed" size={16} color={colors.muted} />
                <T variant="caption" style={{ flex: 1 }}>
                  That’s your {FREE_TRIP_LIMIT} free trip. The Family plan holds them all — or grab a
                  Trip Pass for the next one.
                </T>
                <Ionicons name="chevron-forward" size={16} color={colors.faint} />
              </Card>
            </Pressable>
          )}
        </View>

        <SectionLabel style={styles.sectionLabel}>Need a spark?</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ideas}>
          {IDEAS.map((i) => (
            <Pressable key={i.title} onPress={startNewTrip} accessibilityRole="button">
              <View style={[styles.ideaCard, { backgroundColor: i.bg }]}>
                <Ionicons name={i.icon} size={20} color={i.fg} />
                <T variant="bodySemi" color={i.fg}>
                  {i.title}
                </T>
                <T variant="caption" color={i.fg} style={{ opacity: 0.8 }}>
                  {i.sub}
                </T>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable onPress={signOut} style={styles.signOut} accessibilityRole="button">
          <T variant="caption" color={colors.faint}>
            Sign out (preview)
          </T>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const IDEAS: { title: string; sub: string; icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }[] = [
  { title: 'Beach week', sub: 'Slow mornings, pool naps', icon: 'sunny-outline', bg: colors.sunSoft, fg: '#8A5A00' },
  { title: 'Mountain cabin', sub: 'Short hikes, hot cocoa', icon: 'trail-sign-outline', bg: colors.tealSoft, fg: colors.teal },
  { title: 'Theme-park weekend', sub: 'Big day, early night', icon: 'balloon-outline', bg: '#FBE7E2', fg: colors.coralDeep },
  { title: 'City long weekend', sub: 'Museums + playgrounds', icon: 'business-outline', bg: '#E8EEF8', fg: '#2E5C7A' },
];

const styles = StyleSheet.create({
  content: { paddingBottom: 48 },
  header: { paddingBottom: spacing.xxl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.chip,
    minHeight: 36,
  },
  sectionLabel: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.sm },
  tripList: { paddingHorizontal: spacing.lg, gap: spacing.md },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  daysChip: {
    backgroundColor: colors.tealSoft,
    borderRadius: radius.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 62,
  },
  daysNum: { fontFamily: fonts.display, fontSize: 20, color: colors.teal, letterSpacing: -0.5 },
  upsell: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  ideas: { paddingHorizontal: spacing.lg, gap: spacing.md },
  ideaCard: {
    width: 170,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: 6,
    minHeight: 96,
  },
  signOut: { alignSelf: 'center', marginTop: 36, minHeight: 44, justifyContent: 'center' },
});
