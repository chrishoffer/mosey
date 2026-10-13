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
import { Card, Screen, T, TipStrip } from '../../../src/components/ui';
import { colors, fonts, MIN_TOUCH, radius, spacing } from '../../../src/theme/tokens';

/* Grocery run — the first-day shop for a stay with a kitchen. Mosey seeds the
   basics from the crew (3 kids) and the plans (pancake Saturday, 4+ hr drive);
   parents check things off and add their own. All state is local (useState)
   this phase — no network. Generic items only, no stores or brands (rule #2). */

interface GroceryItem {
  id: string;
  label: string;
  qty?: string; // "×2"
  why?: string; // one-line parent-language reason
  checked: boolean;
}

interface GrocerySection {
  key: string;
  title: string;
  items: GroceryItem[];
}

const SEED_SECTIONS: GrocerySection[] = [
  {
    key: 'breakfast',
    title: 'Breakfast & snacks',
    items: [
      { id: 'g1', label: 'Pancake mix', why: 'Saturday is pancake morning', checked: false },
      { id: 'g2', label: 'Milk', qty: '×2', why: 'Three kids, six days', checked: false },
      { id: 'g3', label: 'Bananas', why: 'Breakfast topper + trail snack', checked: false },
      { id: 'g4', label: 'Coffee', why: 'The cabin pot is only as good as what you bring', checked: false },
    ],
  },
  {
    key: 'kids',
    title: 'Kid essentials',
    items: [
      { id: 'g5', label: 'String cheese', why: 'The one snack all three agree on', checked: false },
      { id: 'g6', label: 'Applesauce pouches', qty: '×6', why: 'Backseat-proof for day trips', checked: false },
      { id: 'g7', label: 'Crackers', qty: '×2', why: 'Quiet-hour snack while Chase naps', checked: false },
    ],
  },
  {
    key: 'dinner',
    title: 'First night dinner',
    items: [
      { id: 'g8', label: 'Pasta + jar sauce', why: '15-minute dinner after a 4-hour drive', checked: false },
      { id: 'g9', label: 'Salad kit', why: 'One vegetable nobody has to chop', checked: false },
      { id: 'g10', label: 'Butter', why: 'Plain-noodle backup for picky night one', checked: false },
    ],
  },
];

export default function GroceryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sections, setSections] = useState<GrocerySection[]>(SEED_SECTIONS);
  const [additions, setAdditions] = useState<GroceryItem[]>([]);
  const [draft, setDraft] = useState('');

  const allItems = [...sections.flatMap((s) => s.items), ...additions];
  const inCart = allItems.filter((i) => i.checked).length;

  const toggleItem = (itemId: string) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)),
      })),
    );
    setAdditions((prev) => prev.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)));
  };

  const addItem = () => {
    const label = draft.trim();
    if (!label) return;
    setAdditions((prev) => [...prev, { id: `your-${Date.now()}`, label, checked: false }]);
    setDraft('');
  };

  const removeItem = (itemId: string) => setAdditions((prev) => prev.filter((i) => i.id !== itemId));

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
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to trip"
              onPress={goBack}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={20} color={colors.ink} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <T variant="heading" style={{ fontFamily: fonts.display }}>
                Grocery run
              </T>
              <T variant="caption">
                First-day shop for the cabin — Mosey stocked the basics from your crew & plans.
              </T>
            </View>
          </View>
          <T style={styles.progress}>
            {inCart} of {allItems.length} in the cart
          </T>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
          {/* Seeded sections */}
          {sections.map((section) => (
            <React.Fragment key={section.key}>
              <View style={styles.sectionRow}>
                <T variant="section">{section.title}</T>
                <T style={styles.sectionCount}>
                  {section.items.filter((i) => i.checked).length} of {section.items.length}
                </T>
              </View>
              <Card style={{ marginHorizontal: spacing.lg }}>
                {section.items.map((item, idx) => (
                  <GroceryRow
                    key={item.id}
                    item={item}
                    last={idx === section.items.length - 1}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))}
              </Card>
            </React.Fragment>
          ))}

          {/* Your additions */}
          {additions.length > 0 ? (
            <>
              <View style={styles.sectionRow}>
                <T variant="section">Your additions</T>
                <T style={styles.sectionCount}>
                  {additions.filter((i) => i.checked).length} of {additions.length}
                </T>
              </View>
              <Card style={{ marginHorizontal: spacing.lg }}>
                {additions.map((item, idx) => (
                  <GroceryRow
                    key={item.id}
                    item={item}
                    last={idx === additions.length - 1}
                    onToggle={() => toggleItem(item.id)}
                    onDelete={() => removeItem(item.id)}
                  />
                ))}
              </Card>
            </>
          ) : null}

          {/* Add your own */}
          <View style={styles.addRow}>
            <View style={styles.inputPill}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={addItem}
                returnKeyType="done"
                placeholder="Add your own — juice boxes, marshmallows…"
                placeholderTextColor={colors.faint}
                accessibilityLabel="Add a grocery item"
                style={styles.input}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add item to the list"
              onPress={addItem}
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}
            >
              <Ionicons name="add" size={24} color={colors.white} />
            </Pressable>
          </View>

          <TipStrip style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg }}>
            Shop the first morning, not arrival night — everyone's too fried after the drive.
          </TipStrip>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function GroceryRow({
  item,
  last,
  onToggle,
  onDelete,
}: {
  item: GroceryItem;
  last: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  return (
    <View style={[styles.itemRow, !last && styles.itemRowBorder]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked }}
        accessibilityLabel={item.label}
        onPress={onToggle}
        style={styles.itemToggle}
      >
        <Ionicons
          name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={item.checked ? colors.teal : colors.faint}
        />
        <View style={{ flex: 1 }}>
          <T
            style={[
              styles.itemLabel,
              item.checked && { color: colors.muted, textDecorationLine: 'line-through', fontFamily: fonts.body },
            ]}
          >
            {item.label}
            {item.qty ? <T style={styles.itemQty}>{`  ${item.qty}`}</T> : null}
          </T>
          {item.why ? <T style={styles.itemSub}>{item.why}</T> : null}
          {onDelete ? <T style={styles.itemSub}>Added by you</T> : null}
        </View>
      </Pressable>
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
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.card,
    paddingTop: 18,
    paddingHorizontal: spacing.lg,
    paddingBottom: 14,
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
  progress: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.teal, marginTop: 10 },
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
    paddingRight: 6,
  },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  itemToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: MIN_TOUCH,
  },
  itemLabel: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  itemQty: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted },
  itemSub: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.muted, marginTop: 1 },
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
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  inputPill: {
    flex: 1,
    height: MIN_TOUCH,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    justifyContent: 'center',
  },
  input: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, paddingVertical: 0 },
  addBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
