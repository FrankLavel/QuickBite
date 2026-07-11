/**
 * components/FloatingActionButton.tsx
 * Botón flotante naranja (+).
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radius, shadows, spacing } from '../utils/theme';

interface FloatingActionButtonProps {
  onPress: () => void;
  label?: string;
}

export function FloatingActionButton({
  onPress,
  label = '+',
}: FloatingActionButtonProps) {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel="Agregar"
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.fab,
  },
  label: {
    color: colors.textOnPrimary,
    fontSize: 28,
    fontWeight: '600',
    marginTop: -2,
  },
});
