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

/** Tendencia comparativa (ej. semana vs. semana anterior). */
export interface MetricTrend {
  /** Magnitud del cambio, en porcentaje (siempre positiva). */
  percent: number;
  direction: 'up' | 'down' | 'flat';
  /** Texto de referencia (ej. "vs. semana pasada"). */
  label?: string;
}

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: FeatherIconName;
  tone?: Tone;
  /** Texto de la insignia superior derecha (ej. "En vivo", "+12%"). */
  badge?: string;
  badgeTone?: BadgeTone;
  /** Tendencia con flecha ▲/▼ y color (reemplaza a `hint` si se provee). */
  trend?: MetricTrend;
  /**
   * Dónde se pinta la tendencia:
   * - 'bottom' (default): píldora bajo el valor, con etiqueta de referencia.
   * - 'top': texto compacto en la esquina superior derecha (estilo analíticas).
   */
  trendPosition?: 'top' | 'bottom';
  /**
   * Estilo de la tarjeta:
   * - 'default': chip de icono arriba + valor grande (dashboard general).
   * - 'compact': etiqueta en mayúsculas, valor grande e indicador inline
   *   (estilo catálogo del mockup de Menú).
   */
  variant?: 'default' | 'compact';
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

const TREND_COLORS: Record<MetricTrend['direction'], { fg: string; icon: FeatherIconName }> = {
  up: { fg: colors.success, icon: 'trending-up' },
  down: { fg: colors.danger, icon: 'trending-down' },
  flat: { fg: colors.textSecondary, icon: 'minus' },
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone,
  badge,
  badgeTone = 'neutral',
  trend,
  trendPosition = 'bottom',
  variant = 'default',
  accent,
  danger,
}: MetricCardProps) {
  const effectiveTone: Tone = danger ? 'danger' : accent ? 'primary' : tone ?? 'primary';
  const toneC = TONE_COLORS[effectiveTone];
  const badgeC = BADGE_COLORS[badgeTone];
  const trendC = trend ? TREND_COLORS[trend.direction] : null;
  const trendOnTop = Boolean(trend && trendC && trendPosition === 'top');
  const showTopRow = Boolean(icon || badge || trendOnTop);

  if (variant === 'compact') {
    return (
      <View style={[styles.card, styles.compactCard, danger && styles.dangerCard]}>
        <Text style={styles.compactLabel}>{label.toUpperCase()}</Text>
        <View style={styles.compactValueRow}>
          <Text style={styles.compactValue} numberOfLines={1}>
            {value}
          </Text>
          <View style={styles.compactTrailing}>
            {hint ? (
              <Text style={[styles.compactHint, { color: toneC.fg }]} numberOfLines={1}>
                {hint}
              </Text>
            ) : icon ? (
              <Feather name={icon} size={16} color={toneC.fg} />
            ) : null}
          </View>
        </View>
      </View>
    );
  }

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
          ) : trendOnTop && trend && trendC ? (
            <View style={styles.trendTop}>
              <Text style={[styles.trendTopText, { color: trendC.fg }]}>
                {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '−' : ''}
                {trend.percent.toFixed(1)}%
              </Text>
              <Feather name={trendC.icon} size={13} color={trendC.fg} />
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {trend && trendC && !trendOnTop ? (
        <View style={styles.trendRow}>
          <View style={styles.trendPill}>
            <Feather name={trendC.icon} size={12} color={trendC.fg} />
            <Text style={[styles.trendText, { color: trendC.fg }]}>
              {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '−' : ''}
              {trend.percent.toFixed(1)}%
            </Text>
          </View>
          {trend.label ? (
            <Text style={styles.trendLabel} numberOfLines={1}>
              {trend.label}
            </Text>
          ) : null}
        </View>
      ) : hint ? (
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
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  trendText: {
    ...typography.caption,
    fontWeight: '800',
    fontSize: 11,
  },
  trendLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    flexShrink: 1,
  },
  trendTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trendTopText: {
    ...typography.caption,
    fontWeight: '800',
  },
  compactCard: {
    justifyContent: 'center',
    minWidth: 160,
  },
  compactLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  compactValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  compactValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
  },
  compactTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactHint: {
    ...typography.caption,
    fontWeight: '700',
    textAlign: 'right',
  },
});
