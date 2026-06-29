import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Text } from './ui';
import { palette, radius, spacing } from '../theme/tokens';

interface Props {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  minimumDate?: Date;
}

/** A tappable field that opens the native date picker. Android shows a dialog;
 *  iOS reveals an inline spinner. Keeps trip creation to a couple of taps. */
export function DateField({ label, value, onChange, minimumDate }: Props) {
  const [show, setShow] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>
      <Pressable
        onPress={() => setShow((s) => !s)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? format(value, 'PPP') : 'not set'}`}
        style={styles.field}
      >
        <Text variant="bodyStrong" color={value ? palette.ink : palette.inkSoft}>
          {value ? format(value, 'EEE, MMM d, yyyy') : 'Pick a date'}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={palette.inkSoft} />
      </Pressable>
      {show && (
        <DateTimePicker
          value={value ?? minimumDate ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimumDate}
          onChange={(event, d) => {
            if (Platform.OS !== 'ios') setShow(false);
            if (event.type === 'set' && d) onChange(d);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, flex: 1 },
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
});
