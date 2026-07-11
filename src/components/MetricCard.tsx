/**
 * components/MetricCard.tsx
 * Tarjeta KPI del panel (pedidos, ingresos, etc.).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../utils/theme';

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  danger?: boolean;
}

export function MetricCard({
  label,
  value,
  hint,
  accent,
  danger,
}: MetricCardProps) {
  return (
    <View
      style={[
        styles.card,
        accent && styles.accent,
        danger && styles.dangerCard,
      ]}
    >
      <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
      <Text style={[styles.label, accent && styles.labelAccent]}>{label}</Text>
      {hint ? (
        <Text style={[styles.hint, accent && styles.labelAccent]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  accent: { backgroundColor: colors.primary },
  dangerCard: { borderWidth: 1, borderColor: colors.dangerSoft },
  value: { ...typography.h2, color: colors.black },
  valueAccent: { color: colors.textOnPrimary },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  labelAccent: { color: 'rgba(255,255,255,0.85)' },
  hint: {
    ...typography.caption,
    color: colors.success,
    marginTop: 2,
    fontWeight: '600',
  },
});
