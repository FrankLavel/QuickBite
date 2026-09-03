/**
 * components/OfferCard.tsx
 * Tarjeta de banner promocional (offer) — vista previa del banner en la app,
 * con estado de visibilidad, cupón vinculado y acciones.
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
  const hidden = !offer.isActive;

  return (
    <View style={[styles.card, hidden && styles.cardHidden]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.imageWrap}>
          <ProductImage uri={offer.image} style={styles.image} dimmed={hidden} />

          {offer.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{offer.badge.toUpperCase()}</Text>
            </View>
          ) : null}

          <View style={styles.editBtn}>
            <Feather name="edit-2" size={14} color={colors.text} />
          </View>

          {hidden ? (
            <View style={styles.hiddenOverlay}>
              <View style={styles.hiddenBadge}>
                <Feather name="eye-off" size={13} color={colors.textOnPrimary} />
                <Text style={styles.hiddenText}>OCULTO</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {offer.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {offer.description || 'Sin descripción.'}
          </Text>
          {offer.type === 'dish' ? (
            <View style={styles.couponChip}>
              <Feather name="coffee" size={11} color={colors.primary} />
              <Text style={styles.couponText}>PLATILLO</Text>
            </View>
          ) : offer.couponCode ? (
            <View style={styles.couponChip}>
              <Feather name="tag" size={11} color={colors.primary} />
              <Text style={styles.couponText}>{offer.couponCode}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      <View style={styles.footer}>
        <View style={styles.switchRow}>
          <Switch
            value={offer.isActive}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={offer.isActive ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.switchLabel,
              { color: offer.isActive ? colors.primary : colors.textMuted },
            ]}
          >
            {offer.isActive ? 'Visible en app' : 'Oculto'}
          </Text>
        </View>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          accessibilityLabel="Eliminar banner"
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
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHidden: { opacity: 0.85 },
  imageWrap: {
    position: 'relative',
    height: 105,
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: colors.textOnPrimary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  editBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  hiddenOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  hiddenText: {
    color: colors.textOnPrimary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  content: { padding: spacing.md },
  title: { ...typography.h3, color: colors.text, fontWeight: '700' },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
    minHeight: 36,
  },
  couponChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: spacing.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  couponText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
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
