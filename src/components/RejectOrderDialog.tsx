/**
 * components/RejectOrderDialog.tsx
 * Diálogo para rechazar un pedido con motivo (presets + texto libre). El motivo
 * se guarda en el pedido para que el cliente vea POR QUÉ se rechazó.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, radius, spacing, typography } from '../utils/theme';

const PRESETS = [
  'Fuera de horario',
  'Producto agotado',
  'Fuera de la zona de reparto',
  'Demasiada demanda ahora',
  'Datos de entrega incompletos',
];

interface Props {
  visible: boolean;
  orderLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export function RejectOrderDialog({
  visible,
  orderLabel,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState('');
  const [custom, setCustom] = useState('');
  const reason = custom.trim() || selected;

  const reset = () => {
    setSelected('');
    setCustom('');
  };
  const handleConfirm = () => {
    if (!reason || loading) return;
    onConfirm(reason);
    reset();
  };
  const handleCancel = () => {
    reset();
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            Rechazar pedido{orderLabel ? ` ${orderLabel}` : ''}
          </Text>
          <Text style={styles.sub}>
            Elige un motivo o escríbelo. El cliente lo verá en su pedido.
          </Text>

          <View style={styles.chips}>
            {PRESETS.map((p) => {
              const on = selected === p && !custom.trim();
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    setSelected(p);
                    setCustom('');
                  }}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{p}</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={custom}
            onChangeText={setCustom}
            placeholder="Otro motivo (opcional)"
            placeholderTextColor={colors.textMuted}
            multiline
            style={styles.input}
          />

          <View style={styles.actions}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
            >
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={!reason || loading}
              style={({ pressed }) => [
                styles.btn,
                styles.btnDanger,
                (!reason || loading) && styles.btnDisabled,
                pressed && styles.pressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={styles.btnDangerText}>Rechazar pedido</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.text, fontWeight: '700' },
  sub: { ...typography.bodySmall, color: colors.textSecondary },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  chipTextOn: { color: colors.danger },
  input: {
    ...typography.bodySmall,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    minHeight: 60,
    marginTop: spacing.xs,
    textAlignVertical: 'top',
    outlineStyle: 'none',
  } as object,
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: { borderWidth: 1, borderColor: colors.border },
  btnGhostText: { ...typography.bodySmall, color: colors.text, fontWeight: '700' },
  btnDanger: { backgroundColor: colors.danger },
  btnDangerText: { ...typography.bodySmall, color: colors.textOnPrimary, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
