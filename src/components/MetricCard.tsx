/**
 * components/MetricCard.tsx
 * Tarjeta KPI del panel (pedidos, ingresos, etc.) — estilo mockup:
 * chip de icono + badge opcional, etiqueta y valor.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors, radius, shadows, spacing, typography } from '../utils/theme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];
type Tone = 'primary' | 'info' | 'success' | 'warning' | 'danger';
type BadgeTone = 'up' | 'live' | 'priority' | 'neutral';

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: FeatherIconName;
  tone?: Tone;
  /** Texto de la insignia superior derecha (ej. "En vivo", "+12%"). */
  badge?: string;
  badgeTone?: BadgeTone;
  /** Compatibilidad: acento verde (equivale a tone="primary"). */
  accent?: boolean;
  /** Compatibilidad: resalta en rojo (equivale a tone="danger"). */
  danger?: boolean;
}

const TONE_COLORS: Record<Tone, { chip: string; fg: string }> = {
  primary: { chip: colors.primarySoft, fg: colors.primary },
  info: { chip: colors.infoSoft, fg: colors.info },
  success: { chip: colors.successSoft, fg: colors.success },
  warning: { chip: colors.warningSoft, fg: colors.warning },
  danger: { chip: colors.dangerSoft, fg: colors.danger },
};

const BADGE_COLORS: Record<BadgeTone, { bg: string; fg: string }> = {
  up: { bg: colors.successSoft, fg: colors.success },
  live: { bg: colors.infoSoft, fg: colors.info },
  priority: { bg: colors.dangerSoft, fg: colors.danger },
  neutral: { bg: colors.surfaceMuted, fg: colors.textSecondary },
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone,
  badge,
  badgeTone = 'neutral',
  accent,
  danger,
}: MetricCardProps) {
  const effectiveTone: Tone = danger ? 'danger' : accent ? 'primary' : tone ?? 'primary';
  const toneC = TONE_COLORS[effectiveTone];
  const badgeC = BADGE_COLORS[badgeTone];
  const showTopRow = Boolean(icon || badge);

  return (
    <View style={[styles.card, danger && styles.dangerCard]}>
      {showTopRow ? (
        <View style={styles.topRow}>
          {icon ? (
            <View style={[styles.iconChip, { backgroundColor: toneC.chip }]}>
              <Feather name={icon} size={18} color={toneC.fg} />
            </View>
          ) : (
            <View />
          )}
          {badge ? (
            <View style={[styles.badge, { backgroundColor: badgeC.bg }]}>
              <Text style={[styles.badgeText, { color: badgeC.fg }]}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? (
        <Text style={[styles.hint, { color: toneC.fg }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  dangerCard: { borderColor: colors.dangerSoft },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  value: {
    ...typography.h1,
    color: colors.text,
    marginTop: 2,
  },
  hint: {
    ...typography.caption,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
});
