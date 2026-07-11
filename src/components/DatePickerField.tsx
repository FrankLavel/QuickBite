/**
 * DatePickerField.tsx
 * Selector de fecha con calendario (nativo) o input date (web).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../utils/theme';

interface DatePickerFieldProps {
  label: string;
  /** YYYY-MM-DD o vacío */
  value: string;
  onChange: (isoDate: string) => void;
  /** Fecha mínima seleccionable (default: hoy) */
  minimumDate?: Date;
  hint?: string;
  error?: string;
}

function parseIsoDate(iso: string): Date | null {
  if (!iso.trim()) return null;
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return 'Sin fecha de vencimiento';
  return d.toLocaleDateString('es-MX', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function DatePickerField({
  label,
  value,
  onChange,
  minimumDate,
  hint,
  error,
}: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const min = minimumDate ?? new Date();
  const selected = parseIsoDate(value) ?? min;

  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) onChange(toIsoDate(date));
  };

  const clearDate = () => onChange('');

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        <View style={styles.webRow}>
          <View style={styles.webInputWrap}>
            {React.createElement('input', {
              type: 'date',
              value,
              min: toIsoDate(min),
              onChange: (e: { target: { value: string } }) =>
                onChange(e.target.value),
              style: {
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: 16,
                fontFamily: 'inherit',
                color: colors.text,
                backgroundColor: 'transparent',
                padding: 0,
              },
            })}
          </View>
          {value ? (
            <TouchableOpacity onPress={clearDate} hitSlop={8}>
              <Feather name="x-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <TouchableOpacity
        style={[styles.trigger, error ? styles.triggerError : null]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.85}
      >
        <Feather name="calendar" size={18} color={colors.primary} />
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {formatDisplay(value)}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {value ? (
        <TouchableOpacity onPress={clearDate} style={styles.clearBtn}>
          <Text style={styles.clearText}>Quitar fecha de vencimiento</Text>
        </TouchableOpacity>
      ) : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={showPicker} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
            <Pressable style={styles.iosSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.iosHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.iosDone}>Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selected}
                mode="date"
                display="inline"
                minimumDate={min}
                onChange={handleChange}
                locale="es-MX"
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : showPicker ? (
        <DateTimePicker
          value={selected}
          mode="date"
          display="default"
          minimumDate={min}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  triggerError: { borderColor: colors.danger },
  triggerText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  placeholder: { color: colors.textMuted },
  clearBtn: { marginTop: spacing.xs },
  clearText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  webRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  webInputWrap: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  iosSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.lg,
  },
  iosHeader: {
    alignItems: 'flex-end',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iosDone: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
});
