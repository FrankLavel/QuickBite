/**
 * components/CouponCard.tsx
 * Tarjeta de cupón/ticket de descuento — estilo "ticket" profesional:
 * bloque de descuento, código, estado, progreso de usos y vigencia.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Coupon } from '../types/coupon';
import {
  isCouponExpired,
  isCouponExhausted,
} from '../services/couponService';
import { colors, radius, shadows, spacing, typography } from '../utils/theme';
import { formatCurrency, formatCurrencyCompact } from '../utils/format';

interface CouponCardProps {
  coupon: Coupon;
  onPress: () => void;
  onToggle: (value: boolean) => void;
  onDelete: () => void;
}

type Status = { label: string; bg: string; fg: string };

function couponStatus(
  coupon: Coupon,
  expired: boolean,
  exhausted: boolean
): Status {
  if (!coupon.isActive)
    return { label: 'Inactivo', bg: colors.surfaceMuted, fg: colors.textSecondary };
  if (expired)
    return { label: 'Vencido', bg: colors.dangerSoft, fg: colors.danger };
  if (exhausted)
    return { label: 'Agotado', bg: colors.warningSoft, fg: colors.warning };
  return { label: 'Activo', bg: colors.successSoft, fg: colors.success };
}

export function CouponCard({
  coupon,
  onPress,
  onToggle,
  onDelete,
}: CouponCardProps) {
  const expired = isCouponExpired(coupon);
  const exhausted = isCouponExhausted(coupon);
  const status = couponStatus(coupon, expired, exhausted);

  const heroValue =
    coupon.type === 'percent'
      ? `${coupon.value}%`
      : formatCurrencyCompact(coupon.value);
  const heroSub = coupon.type === 'percent' ? 'DE DESCUENTO' : 'DE DESCUENTO';

  const usesRatio =
    coupon.maxUses > 0
      ? Math.min(1, coupon.usedCount / coupon.maxUses)
      : 0;
  const usesPctExact = usesRatio * 100;
  // Etiqueta: "<1%" para usos mínimos, para no mostrar "0%" con usos > 0.
  const usesPctLabel =
    coupon.usedCount === 0
      ? '0%'
      : usesPctExact < 1
        ? '<1%'
        : `${Math.round(usesPctExact)}%`;
  // Relleno visible: sliver mínimo del 4% cuando ya hay al menos un uso.
  const fillWidth = coupon.usedCount === 0 ? 0 : Math.max(4, usesPctExact);
  const barColor = exhausted ? colors.warning : colors.primary;

  const dimmed = !coupon.isActive;

  return (
    <View style={[styles.card, dimmed && styles.cardInactive]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.topRow}>
          <View style={styles.hero}>
            <Text style={styles.heroValue} numberOfLines={1}>
              {heroValue}
            </Text>
            <Text style={styles.heroSub}>{heroSub}</Text>
          </View>

          <View style={styles.info}>
            <View style={styles.codeRow}>
              <View style={styles.codeBadge}>
                <Feather name="tag" size={12} color={colors.primary} />
                <Text style={styles.code}>{coupon.code}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusText, { color: status.fg }]}>
                  {status.label}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Feather name="shopping-cart" size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                {coupon.minOrder > 0
                  ? `Mín. ${formatCurrency(coupon.minOrder)}`
                  : 'Sin mínimo'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Feather name="calendar" size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                {coupon.expiresAt
                  ? `Vence ${coupon.expiresAt.toLocaleDateString('es-MX')}`
                  : 'Sin vencimiento'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              Usos {coupon.usedCount} / {coupon.maxUses}
            </Text>
            <Text style={styles.progressPct}>{usesPctLabel}</Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${fillWidth}%`, backgroundColor: barColor },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.footer}>
        <View style={styles.switchRow}>
          <Switch
            value={coupon.isActive}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={coupon.isActive ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.switchLabel,
              { color: coupon.isActive ? colors.primary : colors.textMuted },
            ]}
          >
            {coupon.isActive ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          accessibilityLabel="Eliminar cupón"
        >
          <Feather name="trash-2" size={16} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardInactive: { opacity: 0.7 },
  topRow: { flexDirection: 'row', gap: spacing.md },
  hero: {
    width: 72,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  heroValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textOnPrimary,
  },
  heroSub: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.3,
    color: colors.textSoft,
    marginTop: 2,
  },
  info: { flex: 1, gap: 6 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  code: {
    ...typography.bodySmall,
    color: colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { ...typography.caption, color: colors.textSecondary },
  progressBlock: { marginTop: spacing.md },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressPct: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  track: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.full },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  switchLabel: { ...typography.caption, fontWeight: '700' },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: { backgroundColor: colors.surfaceMuted },
});
