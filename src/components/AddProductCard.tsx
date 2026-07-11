/**
 * components/AddProductCard.tsx
 * Tarjeta punteada para agregar nuevo platillo (mockup).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography } from '../utils/theme';

interface AddProductCardProps {
  width?: number;
  onPress: () => void;
}

export function AddProductCard({ width, onPress }: AddProductCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, width ? { width } : undefined]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.plus}>+</Text>
      </View>
      <Text style={styles.title}>Agregar platillo</Text>
      <Text style={styles.subtitle}>Amplía tu catálogo de menú</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 320,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  plus: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '300',
    lineHeight: 30,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
