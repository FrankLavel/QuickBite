/**
 * components/StatusBadge.tsx
 * Badge de estado de pedido / disponibilidad.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../utils/theme';
import { ORDER_STATUS_LABELS } from '../utils/constants';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: colors.dangerSoft, text: colors.danger },
  accepted: { bg: colors.infoSoft, text: colors.info },
  preparing: { bg: colors.primarySoft, text: colors.primaryDark },
  ready: { bg: colors.successSoft, text: colors.success },
  on_the_way: { bg: colors.infoSoft, text: colors.info },
  delivered: { bg: colors.surfaceMuted, text: colors.textSecondary },
  rejected: { bg: colors.dangerSoft, text: colors.danger },
  cancelled: { bg: colors.dangerSoft, text: colors.danger },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const palette = STATUS_COLORS[status] ?? {
    bg: colors.surfaceMuted,
    text: colors.textSecondary,
  };

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>
        {label ?? ORDER_STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  text: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
