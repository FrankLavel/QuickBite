/**
 * components/OfferCard.tsx
 * Tarjeta de banner promocional (offer).
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
import { ProductImage } from './ProductImage';
import type { Offer } from '../types/offer';
import { colors, radius, shadows, spacing, typography } from '../utils/theme';

interface OfferCardProps {
  offer: Offer;
  onPress: () => void;
  onToggle: (value: boolean) => void;
  onDelete: () => void;
}

export function OfferCard({
  offer,
  onPress,
  onToggle,
  onDelete,
}: OfferCardProps) {
  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.imageWrap}>
          <ProductImage uri={offer.image} style={styles.image} />
          {offer.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{offer.badge.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.title}>{offer.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {offer.description}
        </Text>
        {offer.couponCode ? (
          <View style={styles.couponLink}>
            <Feather name="link" size={12} color={colors.primary} />
            <Text style={styles.couponText}>Cupón: {offer.couponCode}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <View style={styles.footer}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Visible en app</Text>
          <Switch
            value={offer.isActive}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={offer.isActive ? colors.primary : colors.textMuted}
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
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  imageWrap: { position: 'relative', height: 140 },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 10,
    color: colors.textOnPrimary,
    fontWeight: '800',
  },
  title: {
    ...typography.h3,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  couponLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  couponText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.primarySoft,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  switchLabel: { ...typography.caption, color: colors.text },
});
