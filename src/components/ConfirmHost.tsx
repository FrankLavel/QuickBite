/**
 * components/ConfirmHost.tsx
 * Renderiza el diálogo de confirmación (sí/no) en web con el estilo del
 * dashboard, en lugar del window.confirm nativo del navegador. Se monta una
 * sola vez en App.tsx y escucha las solicitudes de utils/confirm.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';
import {
  subscribeConfirm,
  resolveConfirm,
  type ConfirmRequest,
} from '../utils/confirm';
import { colors, radius, shadows, spacing, typography } from '../utils/theme';

export function ConfirmHost() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);

  useEffect(() => subscribeConfirm(setReq), []);

  const visible = req !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => resolveConfirm(false)}
    >
      <Pressable style={styles.overlay} onPress={() => resolveConfirm(false)}>
        {/* Evita que el clic dentro de la tarjeta cierre el diálogo. */}
        <Pressable style={styles.card} onPress={() => {}}>
          {req ? (
            <>
              <View style={styles.head}>
                {req.destructive ? (
                  <View style={styles.iconDanger}>
                    <Feather name="alert-triangle" size={18} color={colors.danger} />
                  </View>
                ) : (
                  <View style={styles.iconInfo}>
                    <Feather name="help-circle" size={18} color={colors.primary} />
                  </View>
                )}
                <Text style={styles.title}>{req.title}</Text>
              </View>

              {req.message ? (
                <Text style={styles.message}>{req.message}</Text>
              ) : null}

              <View style={styles.actions}>
                <Button
                  title={req.cancelText}
                  variant="outline"
                  onPress={() => resolveConfirm(false)}
                  style={styles.btn}
                />
                <Button
                  title={req.confirmText}
                  variant={req.destructive ? 'danger' : 'primary'}
                  onPress={() => resolveConfirm(true)}
                  style={styles.btn}
                />
              </View>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconDanger: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInfo: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '800',
    flex: 1,
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  btn: { minWidth: 120 },
});
