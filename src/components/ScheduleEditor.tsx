/**
 * ScheduleEditor.tsx
 * Editor de horario semanal (abrir/cerrar por día). Se guarda en
 * restaurants/{id}.schedule; la app cliente calcula abierto/cerrado con esto.
 * Un día presente = abierto con {open, close}; ausente = cerrado ese día.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TextInput,
} from 'react-native';
import { WEEK_DAYS } from '../utils/constants';
import type { WeekSchedule, WeekDayKey } from '../types/restaurant';
import { colors, radius, spacing, typography } from '../utils/theme';

interface ScheduleEditorProps {
  value: WeekSchedule;
  onChange: (value: WeekSchedule) => void;
}

const DEFAULT_DAY = { open: '09:00', close: '22:00' };

export function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  const setDayOpen = (key: WeekDayKey, isOpen: boolean) => {
    const next = { ...value };
    if (isOpen) {
      next[key] = value[key] ?? { ...DEFAULT_DAY };
    } else {
      delete next[key];
    }
    onChange(next);
  };

  const setTime = (
    key: WeekDayKey,
    field: 'open' | 'close',
    time: string
  ) => {
    const current = value[key] ?? { ...DEFAULT_DAY };
    onChange({ ...value, [key]: { ...current, [field]: time } });
  };

  return (
    <View>
      {WEEK_DAYS.map(({ key, label }) => {
        const day = value[key];
        const isOpen = Boolean(day);
        return (
          <View key={key} style={styles.row}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{label}</Text>
              <View style={styles.switchWrap}>
                <Text
                  style={[
                    styles.stateText,
                    isOpen ? styles.stateOpen : styles.stateClosed,
                  ]}
                >
                  {isOpen ? 'Abierto' : 'Cerrado'}
                </Text>
                <Switch
                  value={isOpen}
                  onValueChange={(v) => setDayOpen(key, v)}
                  trackColor={{ false: colors.border, true: colors.primarySoft }}
                  thumbColor={isOpen ? colors.primary : colors.textMuted}
                />
              </View>
            </View>

            {isOpen ? (
              <View style={styles.times}>
                <View style={styles.timeField}>
                  <Text style={styles.timeLabel}>Abre</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={day?.open ?? ''}
                    onChangeText={(t) => setTime(key, 'open', t)}
                    placeholder="09:00"
                    placeholderTextColor={colors.textMuted}
                    maxLength={5}
                  />
                </View>
                <View style={styles.timeField}>
                  <Text style={styles.timeLabel}>Cierra</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={day?.close ?? ''}
                    onChangeText={(t) => setTime(key, 'close', t)}
                    placeholder="22:00"
                    placeholderTextColor={colors.textMuted}
                    maxLength={5}
                  />
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
      <Text style={styles.hint}>Formato de 24 horas (ej. 09:00, 22:30).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabel: { ...typography.body, color: colors.text, fontWeight: '600' },
  switchWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stateText: { ...typography.caption, fontWeight: '700' },
  stateOpen: { color: colors.primary },
  stateClosed: { color: colors.textMuted },
  times: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  timeField: { flex: 1 },
  timeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timeInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
