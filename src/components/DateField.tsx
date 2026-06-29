import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Button, Text } from './ui';
import { palette, radius, spacing } from '../theme/tokens';

interface Props {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  minimumDate?: Date;
}

/**
 * A tappable date field. iOS opens a bottom-sheet spinner with a Done button
 * (the old inline calendars overlapped inside the scroll view); Android uses the
 * native dialog. Always defaults to *today*, never a far-past year.
 */
export function DateField({ label, value, onChange, minimumDate }: Props) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(value ?? new Date());

  function openPicker() {
    setTemp(value ?? new Date());
    setOpen(true);
  }

  const display = value ? format(value, 'EEE, MMM d, yyyy') : 'Pick a date';

  const trigger = (
    <>
      <Text variant="label">{label}</Text>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? format(value, 'PPP') : 'not set'}`}
        style={styles.field}
      >
        <Text variant="bodyStrong" color={value ? palette.ink : palette.inkSoft}>
          {display}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={palette.inkSoft} />
      </Pressable>
    </>
  );

  // Android: the native picker is itself a dialog — render it directly.
  if (Platform.OS === 'android') {
    return (
      <View style={styles.wrap}>
        {trigger}
        {open && (
          <DateTimePicker
            value={value ?? new Date()}
            mode="date"
            display="default"
            minimumDate={minimumDate}
            onChange={(event, d) => {
              setOpen(false);
              if (event.type === 'set' && d) onChange(d);
            }}
          />
        )}
      </View>
    );
  }

  // iOS: spinner inside a bottom sheet so nothing overlaps in the scroll view.
  return (
    <View style={styles.wrap}>
      {trigger}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text variant="subtitle">{label}</Text>
            <Button
              label="Done"
              variant="ghost"
              onPress={() => {
                onChange(temp);
                setOpen(false);
              }}
            />
          </View>
          <DateTimePicker
            value={temp}
            mode="date"
            display="spinner"
            minimumDate={minimumDate}
            themeVariant="light"
            style={styles.spinner}
            onChange={(_event, d) => {
              if (d) setTemp(d);
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  field: {
    backgroundColor: palette.paper,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,25,45,0.45)' },
  sheet: {
    backgroundColor: palette.paper,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.x2,
    paddingTop: spacing.md,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  spinner: { alignSelf: 'stretch' },
});
