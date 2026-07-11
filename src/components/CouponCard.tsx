/**
 * components/CouponCard.tsx
 * Tarjeta de cupón/ticket de descuento.
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

interface CouponCardProps {
  coupon: Coupon;
  onPress: () => void;
  onToggle: (value: boolean) => void;
  onDelete: () => void;
}

export function CouponCard({
  coupon,
  onPress,
  onToggle,
  onDelete,
}: CouponCardProps) {
  const expired = isCouponExpired(coupon);
  const exhausted = isCouponExhausted(coupon);
  const valueLabel =
    coupon.type === 'percent'
      ? `${coupon.value}%`
      : `$${coupon.value.toFixed(2)}`;

  return (
    <View style={[styles.card, !coupon.isActive && styles.cardInactive]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.topRow}>
          <View style={styles.codeBadge}>
            <Feather name="tag" size={14} color={colors.textOnPrimary} />
            <Text style={styles.code}>{coupon.code}</Text>
          </View>
          <Text style={styles.value}>{valueLabel}</Text>
        </View>

        <Text style={styles.meta}>
          Mín. pedido ${coupon.minOrder.toFixed(2)} · Usos{' '}
          {coupon.usedCount}/{coupon.maxUses}
        </Text>

        {coupon.expiresAt ? (
          <Text style={styles.meta}>
            Vence: {coupon.expiresAt.toLocaleDateString('es-MX')}
          </Text>
        ) : (
          <Text style={styles.meta}>Sin fecha de vencimiento</Text>
        )}

        {(expired || exhausted) && (
          <View style={styles.warnRow}>
            {expired ? (
              <Text style={styles.warn}>Vencido</Text>
            ) : null}
            {exhausted ? (
              <Text style={styles.warn}>Límite de usos alcanzado</Text>
            ) : null}
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Activo</Text>
          <Switch
            value={coupon.isActive}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={coupon.isActive ? colors.primary : colors.textMuted}
          />
        </View>
        <Pressable onPress={onDelete} hitSlop={8}>
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
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardInactive: { opacity: 0.75 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  code: {
    ...typography.bodySmall,
    color: colors.textOnPrimary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  value: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '800',
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  warnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  warn: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  switchLabel: { ...typography.caption, color: colors.text },
});
