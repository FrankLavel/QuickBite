/**
 * ScheduleEditor.tsx
 * Editor de horario semanal (abrir/cerrar por día). Se guarda en
 * restaurants/{id}.schedule; la app cliente calcula abierto/cerrado con esto.
 * Un día presente = abierto con {open, close}; ausente = cerrado ese día.
 * Diseño compacto: una fila por día (Día · Abre a Cierra · toggle).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WEEK_DAYS } from '../utils/constants';
import type { WeekSchedule, WeekDayKey } from '../types/restaurant';
import { colors, radius, spacing, typography } from '../utils/theme';
import { noOutline } from './InputField';

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

  // Copia el horario del primer día abierto a todos los días.
  const applyToAll = () => {
    const firstOpen = WEEK_DAYS.map(({ key }) => value[key]).find(Boolean);
    const template = firstOpen ?? DEFAULT_DAY;
    const next: WeekSchedule = {};
    WEEK_DAYS.forEach(({ key }) => {
      next[key] = { ...template };
    });
    onChange(next);
  };

  const anyOpen = WEEK_DAYS.some(({ key }) => value[key]);

  return (
    <View>
      <View style={styles.toolbar}>
        <Text style={styles.hint}>Formato de 24 horas (ej. 09:00, 22:30).</Text>
        {anyOpen ? (
          <TouchableOpacity style={styles.applyBtn} onPress={applyToAll}>
            <Feather name="copy" size={12} color={colors.primary} />
            <Text style={styles.applyText}>Aplicar a todos</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {WEEK_DAYS.map(({ key, label }) => {
        const day = value[key];
        const isOpen = Boolean(day);
        return (
          <View key={key} style={[styles.row, !isOpen && styles.rowClosed]}>
            <Text style={styles.dayLabel}>{label}</Text>

            {isOpen ? (
              <View style={styles.times}>
                <Feather
                  name="clock"
                  size={14}
                  color={colors.textSecondary}
                  style={styles.clockIcon}
                />
                <TextInput
                  style={[styles.timeInput, noOutline]}
                  value={day?.open ?? ''}
                  onChangeText={(t) => setTime(key, 'open', t)}
                  placeholder="09:00"
                  placeholderTextColor={colors.textMuted}
                  maxLength={5}
                  textAlign="center"
                />
                <Text style={styles.sep}>a</Text>
                <TextInput
                  style={[styles.timeInput, noOutline]}
                  value={day?.close ?? ''}
                  onChangeText={(t) => setTime(key, 'close', t)}
                  placeholder="22:00"
                  placeholderTextColor={colors.textMuted}
                  maxLength={5}
                  textAlign="center"
                />
              </View>
            ) : (
              <View style={styles.times}>
                <Text style={styles.closed}>Cerrado</Text>
              </View>
            )}

            <Switch
              value={isOpen}
              onValueChange={(v) => setDayOpen(key, v)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isOpen ? colors.primary : colors.textMuted}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  hint: { ...typography.caption, color: colors.textMuted },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  applyText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.sm,
  },
  rowClosed: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  dayLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    width: 88,
  },
  times: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 170,
  },
  clockIcon: { marginRight: 2 },
  timeInput: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    width: 74,
  },
  sep: { ...typography.caption, color: colors.textMuted, marginHorizontal: 2 },
  closed: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
