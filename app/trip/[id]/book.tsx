import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Screen, T } from '../../../src/components/ui';
import { colors, fonts, MIN_TOUCH, radius, spacing } from '../../../src/theme/tokens';
import { trip } from '../../../src/mock/data';

/* Book — matches design/v2-mockups/Book.dc.html.
   Booking checklist with progress + partner link-outs. Payments happen on the
   partner's site (brief §1: link out, no in-app purchase); buttons open the
   partner homepage in the system browser. Mock-only this phase. */

type BookingState = 'booked' | 'next' | 'open';

interface BookingRow {
  id: string;
  title: string;
  detail: string;
  state: BookingState;
  note?: string; // Mosey's context box on the highlighted item
  partner?: 'Booking.com' | 'Viator' | 'Ticketmaster';
  partnerUrl?: string;
}

const BOOKINGS: BookingRow[] = [
  {
    id: 'b1',
    title: '2-bedroom suite · 5 nights',
    detail: 'Booked on Booking.com · confirmation added',
    state: 'booked',
  },
  {
    id: 'b2',
    title: 'Aquarium · Fri 9:15',
    detail: 'Booked on Viator · 5 tickets',
    state: 'booked',
  },
  {
    id: 'b3',
    title: 'Family dinner show · Sat 5:00',
    detail: 'Fits before bedtime · 12 min from the suite',
    state: 'next',
    note: "Mosey already picked the time and seats for 2 adults and 3 kids. You'll pay on Ticketmaster, then come right back.",
    partner: 'Ticketmaster',
    partnerUrl: 'https://www.ticketmaster.com',
  },
  {
    id: 'b4',
    title: 'Coaster ride tickets · Sun',
    detail: 'Height check: the 4-year-old may be too short',
    state: 'open',
    partner: 'Viator',
    partnerUrl: 'https://www.viator.com',
  },
];

const BOOKED_COUNT = BOOKINGS.filter((b) => b.state === 'booked').length;
const TOTAL_SO_FAR = '$1,355 so far'; // mock running total of the two booked items

export default function BookScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.push(`/trip/${id ?? '1'}`);
  };

  const openPartner = (url?: string) => {
    if (url) Linking.openURL(url);
  };

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to trip" onPress={goBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <T variant="heading">Lock it in</T>
          <T variant="caption">{trip.title}</T>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}>
        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            <T style={styles.progressLabel}>{BOOKED_COUNT} of {BOOKINGS.length} booked</T>
            <T style={styles.progressTotal}>{TOTAL_SO_FAR}</T>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(BOOKED_COUNT / BOOKINGS.length) * 100}%` }]} />
          </View>
        </View>

        {/* Checklist */}
        <View style={styles.list}>
          {BOOKINGS.map((b) =>
            b.state === 'next' ? (
              <Card key={b.id} style={styles.nextCard}>
                <View style={styles.rowTop}>
                  <Ionicons name="ellipse-outline" size={26} color={colors.faint} />
                  <View style={{ flex: 1 }}>
                    <T style={styles.rowTitle}>{b.title}</T>
                    <T variant="caption">{b.detail}</T>
                  </View>
                </View>
                {b.note ? (
                  <View style={styles.noteBox}>
                    <T style={styles.noteText}>{b.note}</T>
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openPartner(b.partnerUrl)}
                  style={({ pressed }) => [styles.partnerBtn, pressed && { opacity: 0.9 }]}
                >
                  <T style={styles.partnerBtnLabel}>Book on {b.partner}</T>
                  <Ionicons name="open-outline" size={18} color={colors.white} />
                </Pressable>
              </Card>
            ) : (
              <Card key={b.id} style={styles.rowCard}>
                <Ionicons
                  name={b.state === 'booked' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={26}
                  color={b.state === 'booked' ? colors.teal : colors.faint}
                />
                <View style={{ flex: 1 }}>
                  <T style={styles.rowTitle}>{b.title}</T>
                  <T variant="caption">{b.detail}</T>
                </View>
                {b.state === 'open' ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openPartner(b.partnerUrl)}
                    style={({ pressed }) => [styles.smallBookBtn, pressed && { opacity: 0.85 }]}
                  >
                    <T style={styles.smallBookLabel}>Book</T>
                  </Pressable>
                ) : null}
              </Card>
            ),
          )}
        </View>

        <View style={{ flex: 1 }} />

        {/* Confirmation-ingestion promise */}
        <View style={styles.inkStrip}>
          <Ionicons name="mail-outline" size={22} color={colors.sun} style={{ marginTop: 2 }} />
          <T style={styles.inkStripText}>
            Mosey reads your booking confirmations, then drops each one onto the right day and adjusts the plan around
            it.
          </T>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.card,
    paddingTop: 18,
    paddingHorizontal: spacing.lg,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: 22,
    backgroundColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: { paddingTop: spacing.lg, paddingHorizontal: spacing.xl, paddingBottom: 6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  progressTotal: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.muted },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.line, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: colors.teal },
  list: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 10 },
  rowCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  nextCard: {
    padding: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  noteBox: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.ground,
    borderRadius: 10,
  },
  noteText: { fontSize: 13, lineHeight: 19, color: colors.muted, fontFamily: fonts.body },
  partnerBtn: {
    marginTop: 12,
    height: 50,
    borderRadius: radius.button,
    backgroundColor: colors.coral,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  partnerBtnLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.white },
  smallBookBtn: {
    height: MIN_TOUCH,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBookLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  inkStrip: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  inkStripText: { flex: 1, color: colors.white, fontSize: 14, lineHeight: 20, fontFamily: fonts.body },
});
