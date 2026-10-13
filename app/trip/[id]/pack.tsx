import React, { useState } from 'react';
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
import { Card, Screen, T } from '../../../src/components/ui';
import { colors, fonts, MIN_TOUCH, radius, spacing } from '../../../src/theme/tokens';
import { packItems as seedItems, travelers, trip, type PackItem } from '../../../src/mock/data';

/* Pack — matches design/v2-mockups/Pack.dc.html.
   Per-person tabs (travelers + Shared), live progress, laundry toggle,
   learned-from-last-trip rows, carry-on warnings in the warn color, a
   "Don't forget" pack-last section, and a decorative voice-add mic button.
   All state is local (useState) this phase. */

/** PackItem plus a local flag for parent-added rows (mock-data shape untouched). */
type LocalPackItem = PackItem & { custom?: boolean };

const kids = travelers.filter((t) => !t.isAdult);

const TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'Whole crew' },
  ...kids.map((k) => ({ key: k.id, label: `${k.label} · ${k.age}` })),
  { key: 'shared', label: 'Shared' },
];

function ownerLabel(item: LocalPackItem): string {
  if (item.travelerId === null) return 'Shared';
  return travelers.find((t) => t.id === item.travelerId)?.label ?? '';
}

export default function PackScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState<LocalPackItem[]>(seedItems);
  const [laundry, setLaundry] = useState(trip.laundryAccess);
  const [draft, setDraft] = useState('');

  const togglePacked = (itemId: string) =>
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, packed: !i.packed } : i)));

  const addCustomItem = () => {
    const label = draft.trim();
    if (!label) return;
    // New items land on the active tab; "Whole crew" / "Shared" both mean shared.
    const travelerId = tab === 'all' || tab === 'shared' ? null : tab;
    setItems((prev) => [...prev, { id: `custom-${Date.now()}`, travelerId, label, packed: false, custom: true }]);
    setDraft('');
  };

  const removeCustomItem = (itemId: string) => setItems((prev) => prev.filter((i) => i.id !== itemId));

  const inTab = (i: LocalPackItem) =>
    tab === 'all' ? true : tab === 'shared' ? i.travelerId === null : i.travelerId === tab;

  const visible = items.filter(inTab);
  const mainItems = visible.filter((i) => !i.packLast);
  const packLastItems = visible.filter((i) => i.packLast);
  const packedTotal = items.filter((i) => i.packed).length;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.push(`/trip/${id ?? '1'}`);
  };

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to trip" onPress={goBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <T variant="heading" style={{ fontFamily: fonts.display }}>
              Packing for {travelers.length}
            </T>
            <T variant="caption">
              {packedTotal} of {items.length} packed · leave Fri 8 am
            </T>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <Pressable
                key={t.key}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setTab(t.key)}
                hitSlop={{ top: 2, bottom: 2 }}
                style={[styles.tabChip, on ? styles.tabChipOn : styles.tabChipOff]}
              >
                <T
                  style={{
                    fontFamily: on ? fonts.bodyBold : fonts.bodySemi,
                    fontSize: 14,
                    color: on ? colors.white : colors.ink,
                  }}
                >
                  {t.label}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {/* Keeps the add-your-own input above the keyboard; the mic FAB stays
            outside so it doesn't move when the keyboard opens. */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
        <ScrollView contentContainerStyle={{ paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
          {/* Laundry access */}
          <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}>
            <View style={styles.laundryRow}>
              <View style={styles.laundryIcon}>
                <Ionicons name="shirt-outline" size={20} color="#8A5A00" />
              </View>
              <View style={{ flex: 1 }}>
                <T style={styles.rowTitle}>Laundry access</T>
                <T variant="caption">
                  {laundry ? 'Suite has a washer · pack 3 days, not 5' : 'No washer — pack the full 5 days'}
                </T>
              </View>
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: laundry }}
                accessibilityLabel="Laundry access"
                onPress={() => setLaundry((v) => !v)}
                hitSlop={8}
                style={[styles.toggle, { backgroundColor: laundry ? colors.teal : colors.faint }]}
              >
                <View style={[styles.toggleKnob, laundry ? { right: 3 } : { left: 3 }]} />
              </Pressable>
            </View>
            <View style={styles.learnedStrip}>
              <T style={styles.learnedText}>
                <T style={[styles.learnedText, { fontFamily: fonts.bodyBold }]}>Learned from last trip:</T>
                {' skipped the extra shoes'}
              </T>
            </View>
          </Card>

          {/* Main list */}
          <View style={styles.sectionRow}>
            <T variant="section">Fri · aquarium + pool</T>
            <T style={styles.sectionCount}>
              {mainItems.filter((i) => i.packed).length} of {mainItems.length}
            </T>
          </View>
          <Card style={{ marginHorizontal: spacing.lg }}>
            {mainItems.map((item) => (
              <PackRow
                key={item.id}
                item={item}
                showOwner={tab === 'all'}
                last={false}
                onToggle={() => togglePacked(item.id)}
                onDelete={item.custom ? () => removeCustomItem(item.id) : undefined}
              />
            ))}
            {mainItems.length === 0 ? (
              <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                <T variant="caption">Nothing here yet — add your own below, or use the mic.</T>
              </View>
            ) : null}
            {/* Add your own — goes to the active tab */}
            <View style={styles.addRow}>
              <View style={styles.addInputWrap}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={addCustomItem}
                  returnKeyType="done"
                  placeholder="Add your own — goggles, white-noise app…"
                  placeholderTextColor={colors.faint}
                  accessibilityLabel="Add a packing item"
                  style={styles.addInput}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add item to the packing list"
                onPress={addCustomItem}
                style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}
              >
                <Ionicons name="add" size={24} color={colors.white} />
              </Pressable>
            </View>
          </Card>

          {/* Pack-last section */}
          {packLastItems.length > 0 ? (
            <>
              <View style={styles.sectionRow}>
                <T variant="section">Don't forget</T>
              </View>
              <Card style={{ marginHorizontal: spacing.lg }}>
                {packLastItems.map((item, idx) => (
                  <PackRow
                    key={item.id}
                    item={item}
                    showOwner={tab === 'all'}
                    last={idx === packLastItems.length - 1}
                    onToggle={() => togglePacked(item.id)}
                  />
                ))}
              </Card>
            </>
          ) : null}
        </ScrollView>
        </KeyboardAvoidingView>

        {/* Voice add — decorative this phase (brief §7: expo-speech-recognition later) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add items by voice"
          onPress={() => {}}
          style={({ pressed }) => [styles.micFab, pressed && { opacity: 0.9 }]}
        >
          <Ionicons name="mic" size={24} color={colors.white} />
        </Pressable>
      </View>
    </Screen>
  );
}

function PackRow({
  item,
  showOwner,
  last,
  onToggle,
  onDelete,
}: {
  item: LocalPackItem;
  showOwner: boolean;
  last: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  const sub = [showOwner ? ownerLabel(item) : null, item.reason, item.custom ? 'Added by you' : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.packed }}
      onPress={onToggle}
      style={[styles.itemRow, !last && styles.itemRowBorder]}
    >
      <Ionicons
        name={item.packed ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={item.packed ? colors.teal : colors.faint}
      />
      <View style={{ flex: 1 }}>
        <T
          style={[
            styles.itemLabel,
            item.packed && { color: colors.muted, textDecorationLine: 'line-through', fontFamily: fonts.body },
          ]}
        >
          {item.label}
        </T>
        {sub ? <T style={styles.itemSub}>{sub}</T> : null}
        {item.learned ? <T style={styles.itemLearned}>Learned from last trip — you used this</T> : null}
        {item.carryOnWarning ? (
          <View style={styles.warnRow}>
            <Ionicons name="warning" size={13} color={colors.warn} />
            <T style={styles.warnText}>{item.carryOnWarning}</T>
          </View>
        ) : null}
        {item.packLast ? <T style={styles.packLastText}>Pack last · morning of</T> : null}
      </View>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.label}`}
          onPress={onDelete}
          hitSlop={12}
          style={styles.deleteBtn}
        >
          <Ionicons name="close" size={16} color={colors.faint} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.card,
    paddingTop: 18,
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: 22,
    backgroundColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChipOn: { backgroundColor: colors.ink },
  tabChipOff: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong },
  laundryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  laundryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.sunSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  toggle: { width: 50, height: 30, borderRadius: 15 },
  toggleKnob: {
    position: 'absolute',
    top: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  learnedStrip: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.tealSoft },
  learnedText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: '#0B4F47' },
  sectionRow: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionCount: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: MIN_TOUCH,
  },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  itemLabel: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  itemSub: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.muted, marginTop: 1 },
  itemLearned: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16, color: colors.teal, marginTop: 1 },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  warnText: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16, color: colors.warn, flex: 1 },
  packLastText: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16, color: colors.coral, marginTop: 1 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ground,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  addInputWrap: {
    flex: 1,
    height: MIN_TOUCH,
    paddingHorizontal: spacing.lg,
    borderRadius: 22,
    backgroundColor: colors.ground,
    justifyContent: 'center',
  },
  addInput: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, paddingVertical: 0 },
  addBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micFab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coral,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
