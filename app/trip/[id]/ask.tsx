import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, T } from '../../../src/components/ui';
import { colors, fonts, MIN_TOUCH, radius, spacing } from '../../../src/theme/tokens';
import { agentQuickActions } from '../../../src/mock/data';

/* Ask Mosey — matches design/v2-mockups/Agent.dc.html.
   All replies are CANNED local constants (no AI, no network). Replan proposals
   NEVER auto-apply — the parent taps "Update my day" (brief §6). Every
   suggestion carries a one-line plain-parent "why". Suggestions stay generic:
   no real place names (CLAUDE.md hard line #2). */

type QuickAction = (typeof agentQuickActions)[number];

interface Proposal {
  photoColor: string;
  title: string;
  meta: string;
  body: string;
  why: string;
  altIdea: string; // canned "Other ideas" follow-up
}

interface Msg {
  id: string;
  role: 'user' | 'mosey';
  text?: string;
  proposal?: Proposal;
}

const QUICK_ACTION_LABELS: Record<QuickAction, string> = {
  Meltdown: 'Meltdown: find calm',
  Raining: "It's raining",
  'Hungry now': 'Hungry now',
  'Running late': 'Running late',
};

const CANNED: Record<QuickAction, { user: string; intro: string; proposal: Proposal }> = {
  Meltdown: {
    user: 'The little one is done. Need somewhere quiet in the next 15 min, then lunch.',
    intro: "Got it. Here's the fix:",
    proposal: {
      photoColor: '#6B8A5E',
      title: 'Riverside park & playground',
      meta: '4 min walk · shade · restrooms',
      body: 'Then lunch at 12:15 across the street. I moved the pool to 3:30 so nap time stays clear.',
      why: 'Why: quiet and close beats perfect when a kid is at the edge.',
      altIdea:
        'Backup: the covered creekside path behind the parking lot — 2 min away, hardly anyone there. Why: moving water calms faster than a crowd.',
    },
  },
  Raining: {
    user: 'It just started raining and our whole afternoon was outside.',
    intro: "No problem — here's the dry version of your afternoon:",
    proposal: {
      photoColor: '#2E5C7A',
      title: 'Indoor swap for the afternoon',
      meta: 'Mini-golf & arcade · 4 min drive · all indoors',
      body: "I'd slide the waterfall walk to tomorrow morning and put indoor mini-golf at 3:00. Dinner stays at 6.",
      why: 'Why: one dry anchor saves the day — no soggy kids, nap untouched.',
      altIdea:
        'Backup: a pottery-painting hour — 7 min away, calm and warm. Why: a sit-down activity resets everyone after a rain scramble.',
    },
  },
  'Hungry now': {
    user: "Everyone's hungry NOW. We're 90 minutes from the lunch plan.",
    intro: "Feed them first — here's how it fits:",
    proposal: {
      photoColor: '#8A6A4E',
      title: 'Early lunch, two blocks over',
      meta: '3 min walk · kids’ menu · high chairs',
      body: 'Eat at 11:30 instead of 12:30. The pool slides 30 minutes later and everything else holds.',
      why: 'Why: feeding kids before the crash beats keeping a perfect schedule.',
      altIdea:
        'Backup: snack bin from the car now, real lunch at 12:00 as planned. Why: ten minutes of crackers buys you an hour of goodwill.',
    },
  },
  'Running late': {
    user: "We're running about 40 minutes behind this morning.",
    intro: "Easy — trim the morning, keep the fun:",
    proposal: {
      photoColor: '#7A5E8A',
      title: 'Trim the morning, keep the fun',
      meta: 'Skip the overlook stop · saves 40 min',
      body: "Head straight to the aquarium for 10:40. I'll move the waterfall walk to 3:15 so nap still fits.",
      why: 'Why: cutting one stop now keeps bedtime on time tonight.',
      altIdea:
        'Backup: keep every stop but shorten each by 15 minutes. Why: kids handle shorter stops better than skipped ones.',
    },
  },
};

const TYPED_REPLY: Msg = {
  id: 'seedtyped',
  role: 'mosey',
  text: 'On it. I\'d slow the next hour down — I can hold the pool until 3:30 so nothing stacks up. Why: one looser hour now keeps the evening on track.',
};

// Opening thread, exactly as in the mockup (the Meltdown exchange).
const INITIAL_MESSAGES: Msg[] = [
  { id: 'm1', role: 'user', text: CANNED.Meltdown.user },
  { id: 'm2', role: 'mosey', text: CANNED.Meltdown.intro },
  { id: 'm3', role: 'mosey', proposal: CANNED.Meltdown.proposal },
];

export default function AskScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [applied, setApplied] = useState<string[]>([]); // proposal message ids the parent accepted
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const nextId = useRef(100);

  const push = (msgs: Omit<Msg, 'id'>[]) => {
    setMessages((prev) => [...prev, ...msgs.map((m) => ({ ...m, id: `m${nextId.current++}` }))]);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const onQuickAction = (action: QuickAction) => {
    const c = CANNED[action];
    push([
      { role: 'user', text: c.user },
      { role: 'mosey', text: c.intro },
      { role: 'mosey', proposal: c.proposal },
    ]);
  };

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    push([
      { role: 'user', text },
      { role: 'mosey', text: TYPED_REPLY.text },
    ]);
  };

  const onApply = (msgId: string) => {
    // Explicit accept step — proposals never auto-apply (brief §6).
    setApplied((prev) => [...prev, msgId]);
    push([{ role: 'mosey', text: 'Done — your day is updated. Nap and bedtime are still protected.' }]);
  };

  const onOtherIdeas = (p: Proposal) => push([{ role: 'mosey', text: p.altIdea }]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.push(`/trip/${id ?? '1'}`);
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to trip" onPress={goBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <T variant="heading" style={{ fontFamily: fonts.display }}>
              Mosey
            </T>
            <T style={styles.headerSub}>Fri, Day 2 · you're at the aquarium</T>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickGrid}>
          {agentQuickActions.map((a) => (
            <Pressable
              key={a}
              accessibilityRole="button"
              onPress={() => onQuickAction(a)}
              style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.85 }]}
            >
              <T style={styles.quickLabel}>{QUICK_ACTION_LABELS[a]}</T>
            </Pressable>
          ))}
        </View>

        {/* Chat thread */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.thread}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m) =>
            m.proposal ? (
              <ProposalCard
                key={m.id}
                proposal={m.proposal}
                applied={applied.includes(m.id)}
                onApply={() => onApply(m.id)}
                onOtherIdeas={() => onOtherIdeas(m.proposal!)}
              />
            ) : (
              <View key={m.id} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleMosey]}>
                <T style={{ color: m.role === 'user' ? colors.white : colors.ink, fontSize: 15, lineHeight: 21 }}>
                  {m.text}
                </T>
              </View>
            ),
          )}
        </ScrollView>

        {/* Composer */}
        <View style={styles.composer}>
          <View style={styles.inputPill}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={onSend}
              returnKeyType="send"
              placeholder="Tell Mosey what's happening"
              placeholderTextColor={colors.faint}
              accessibilityLabel="Message Mosey"
              style={styles.input}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Talk to Mosey"
            onPress={() => {}} // decorative this phase (voice comes later)
            style={styles.micBtn}
          >
            <Ionicons name="mic" size={22} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ProposalCard({
  proposal,
  applied,
  onApply,
  onOtherIdeas,
}: {
  proposal: Proposal;
  applied: boolean;
  onApply: () => void;
  onOtherIdeas: () => void;
}) {
  return (
    <View style={styles.proposal}>
      <View style={[styles.photo, { backgroundColor: proposal.photoColor }]}>
        <T style={styles.photoLabel}>[PHOTO]</T>
      </View>
      <View style={{ padding: 12, paddingHorizontal: 14 }}>
        <T style={styles.proposalTitle}>{proposal.title}</T>
        <T variant="caption" style={{ marginTop: 2 }}>
          {proposal.meta}
        </T>
        <View style={styles.proposalBody}>
          <T style={{ fontSize: 14, lineHeight: 20 }}>{proposal.body}</T>
        </View>
        <T style={styles.why}>{proposal.why}</T>
        <View style={styles.proposalActions}>
          {applied ? (
            <View style={[styles.applyBtn, { backgroundColor: colors.teal }]}>
              <T style={styles.applyLabel}>Day updated ✓</T>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={onApply}
              style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.9 }]}
            >
              <T style={styles.applyLabel}>Update my day</T>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={onOtherIdeas}
            style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.85 }]}
          >
            <T style={[styles.applyLabel, { color: colors.ink }]}>Other ideas</T>
          </Pressable>
        </View>
      </View>
    </View>
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
  headerSub: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 17, color: colors.teal },
  quickGrid: {
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickBtn: {
    width: '48.5%',
    flexGrow: 1,
    height: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  thread: { paddingHorizontal: spacing.lg, paddingVertical: 14, gap: 12 },
  bubble: { paddingVertical: 12, paddingHorizontal: 14 },
  bubbleUser: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
    backgroundColor: colors.ink,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleMosey: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    backgroundColor: colors.card,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  proposal: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  photo: { height: 88, justifyContent: 'flex-end', paddingHorizontal: 12, paddingVertical: 10 },
  photoLabel: { color: colors.white, fontSize: 12, opacity: 0.85 },
  proposalTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  proposalBody: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.ground,
    borderRadius: 10,
  },
  why: { marginTop: 8, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.muted },
  proposalActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  applyBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.white },
  ghostBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composer: {
    paddingTop: 10,
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  inputPill: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    backgroundColor: colors.ground,
    justifyContent: 'center',
  },
  input: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, paddingVertical: 0 },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
