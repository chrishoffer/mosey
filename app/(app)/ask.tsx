import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Card, Screen, Text } from '../../src/components/ui';
import { Sparkle } from '../../src/components/Sparkle';
import { useTrips } from '../../src/hooks';
import { qk } from '../../src/lib/queryClient';
import { askMosey, type AskMoseyReply, type PerformedAction } from '../../src/lib/ai';
import { getAccent, palette, radius, spacing } from '../../src/theme/tokens';

const STARTERS = [
  'What am I forgetting?',
  'Add a reminder to pay the final balance 60 days before we leave',
  'Add water shoes and reef-safe sunscreen to the packing list',
  'How should I pace the days with little kids?',
];

interface Turn {
  role: 'you' | 'mosey';
  text: string;
  suggestions?: string[];
  deferred?: boolean;
  actions?: PerformedAction[];
}

const ACTION_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  add_reminder: 'notifications-outline',
  add_packing: 'checkbox-outline',
  add_transit: 'airplane-outline',
  add_home_task: 'home-outline',
  add_logistics: 'document-text-outline',
};

export default function Ask() {
  const params = useLocalSearchParams<{ trip?: string }>();
  const trips = useTrips();
  const qc = useQueryClient();
  const list = trips.data ?? [];

  // Resolve the trip context: explicit param → active trip → first trip.
  const [tripId, setTripId] = useState<string | null>(null);
  useEffect(() => {
    if (tripId) return;
    const fromParam = params.trip && list.find((t) => t.id === params.trip)?.id;
    const active = list.find((t) => t.status === 'active')?.id;
    setTripId(fromParam || active || list[0]?.id || null);
  }, [params.trip, list, tripId]);

  const trip = list.find((t) => t.id === tripId) ?? null;
  const accent = getAccent(trip?.accent_color);

  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function send(question: string) {
    const q = question.trim();
    if (!q || !tripId || busy) return;
    setInput('');
    setTurns((prev) => [...prev, { role: 'you', text: q }]);
    setBusy(true);
    const res = await askMosey(tripId, q);
    setBusy(false);
    const reply: AskMoseyReply = res.ok && res.data
      ? res.data
      : {
          answer:
            'I had trouble reaching my brain just now. Try again in a moment — and remember I stick to packing, prep, and gentle pacing guidance for this trip.',
        };
    setTurns((prev) => [
      ...prev,
      {
        role: 'mosey',
        text: reply.answer,
        suggestions: reply.suggestions,
        deferred: reply.deferred,
        actions: reply.actions,
      },
    ]);
    // If Mosey added things to the plan, refresh the affected screens.
    if (reply.actions && reply.actions.length && tripId) {
      qc.invalidateQueries({ queryKey: qk.timeline(tripId) });
      qc.invalidateQueries({ queryKey: qk.packing(tripId) });
      qc.invalidateQueries({ queryKey: qk.transit(tripId) });
      qc.invalidateQueries({ queryKey: qk.homeTasks(tripId) });
      qc.invalidateQueries({ queryKey: qk.logistics(tripId) });
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  if (!trips.isLoading && list.length === 0) {
    return (
      <Screen>
        <Header accent={accent.base} />
        <View style={styles.empty}>
          <Sparkle size={40} color={accent.base} />
          <Text variant="title" style={{ textAlign: 'center', marginTop: spacing.md }}>
            Ask Mosey lives inside a trip
          </Text>
          <Text variant="body" color={palette.inkSoft} style={{ textAlign: 'center', marginTop: spacing.sm }}>
            Create a trip first — then I can help with packing, the travel day, and how to pace things
            for your crew.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <Header accent={accent.base} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {list.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tripPicker}
          >
            {list.map((t) => {
              const a = getAccent(t.accent_color);
              const active = t.id === tripId;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    setTripId(t.id);
                    setTurns([]);
                  }}
                  style={[styles.tripChip, { borderColor: a.base }, active && { backgroundColor: a.base }]}
                >
                  <Text variant="label" color={active ? palette.white : palette.ink}>
                    {t.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <ScrollView ref={scrollRef} contentContainerStyle={styles.thread}>
          {turns.length === 0 ? (
            <View style={styles.intro}>
              <Card lift="soft">
                <Text variant="bodyStrong">Hi — I’m Mosey.</Text>
                <Text variant="body" color={palette.inkSoft} style={{ marginTop: spacing.xs }}>
                  Ask me about packing, the getting-there kit, what you might be forgetting, or how to
                  pace your days. I can also <Text variant="bodyStrong" color={accent.deep}>add reminders
                  and items straight to your trip</Text> — just say “add…” or “remind me…”. I keep it
                  general — I won’t invent specific places.
                </Text>
              </Card>
              <View style={styles.starters}>
                {STARTERS.map((s) => (
                  <Pressable key={s} onPress={() => send(s)} style={styles.starter}>
                    <Text variant="label" color={accent.deep}>
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            turns.map((turn, i) => <Bubble key={i} turn={turn} accent={accent} onChip={send} />)
          )}
          {busy && (
            <View style={[styles.bubble, styles.moseyBubble]}>
              <ActivityIndicator color={accent.base} />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask Mosey…"
            placeholderTextColor={palette.inkSoft}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            multiline
          />
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || busy}
            accessibilityLabel="Send"
            style={[styles.sendBtn, { backgroundColor: accent.base }, (!input.trim() || busy) && { opacity: 0.4 }]}
          >
            <Ionicons name="arrow-up" size={20} color={palette.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Bubble({ turn, accent, onChip }: { turn: Turn; accent: ReturnType<typeof getAccent>; onChip: (s: string) => void }) {
  const isYou = turn.role === 'you';
  return (
    <View style={[styles.bubble, isYou ? styles.youBubble : styles.moseyBubble, isYou && { backgroundColor: accent.base }]}>
      {!isYou && (
        <View style={styles.moseyTag}>
          <Sparkle size={14} color={accent.base} />
          <Text variant="overline" color={accent.deep}>
            Mosey
          </Text>
        </View>
      )}
      <Text variant="body" color={isYou ? palette.white : palette.ink}>
        {turn.text}
      </Text>
      {turn.actions && turn.actions.length > 0 ? (
        <View style={styles.actions}>
          <Text variant="overline" color={accent.deep}>
            Added to your trip
          </Text>
          {turn.actions.map((a, i) => (
            <View key={i} style={[styles.actionChip, { backgroundColor: accent.tint }]}>
              <Ionicons name={ACTION_ICON[a.type] ?? 'add-circle-outline'} size={15} color={accent.deep} />
              <Text variant="caption" color={accent.deep} style={{ flex: 1 }}>
                {a.label}
              </Text>
              <Ionicons name="checkmark" size={15} color={accent.deep} />
            </View>
          ))}
        </View>
      ) : null}
      {turn.deferred ? (
        <View style={styles.deferred}>
          <Ionicons name="time-outline" size={14} color={palette.inkSoft} />
          <Text variant="caption" color={palette.inkSoft}>
            Specific place picks are coming in a later update.
          </Text>
        </View>
      ) : null}
      {turn.suggestions && turn.suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {turn.suggestions.map((s) => (
            <Pressable key={s} onPress={() => onChip(s)} style={[styles.suggestChip, { borderColor: accent.base }]}>
              <Text variant="caption" color={accent.deep}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Header({ accent }: { accent: string }) {
  return (
    <View style={styles.header}>
      <Sparkle size={22} color={accent} />
      <Text variant="title">Ask Mosey</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  tripPicker: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  tripChip: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: 'center',
  },
  thread: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  intro: { gap: spacing.lg },
  starters: { gap: spacing.sm },
  starter: {
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  bubble: { borderRadius: radius.lg, padding: spacing.lg, maxWidth: '92%' },
  youBubble: { alignSelf: 'flex-end' },
  moseyBubble: { alignSelf: 'flex-start', backgroundColor: palette.card, gap: spacing.xs },
  moseyTag: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  deferred: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  actions: { marginTop: spacing.sm, gap: spacing.xs },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  suggestChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    backgroundColor: palette.paper,
  },
  input: {
    flex: 1,
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: 'HankenGrotesk_500Medium',
    fontSize: 16,
    color: palette.ink,
    maxHeight: 120,
    minHeight: 48,
  },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
