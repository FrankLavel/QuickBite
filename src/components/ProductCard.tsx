/**
 * components/ProductCard.tsx
 * Tarjeta de platillo estilo catálogo (mockup Menu Catalog).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Product } from '../types/product';
import { ProductImage } from './ProductImage';
import { colors, radius, shadows, spacing, typography } from '../utils/theme';

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  width?: number;
  onPress: () => void;
  onToggleAvailable: (value: boolean) => void;
  onDelete: () => void;
}

export function ProductCard({
  product,
  categoryName,
  width,
  onPress,
  onToggleAvailable,
  onDelete,
}: ProductCardProps) {
  const tagsPreview =
    product.tags.length > 0
      ? product.tags.slice(0, 3).join(' · ')
      : null;

  return (
    <View style={[styles.card, width ? { width } : undefined]}>
      <View style={styles.imageWrap}>
        <ProductImage
          uri={product.imageURL}
          style={styles.image}
          dimmed={!product.isAvailable}
        />

        {categoryName ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {categoryName.toUpperCase()}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.editBtn}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Feather name="edit-2" size={15} color={colors.text} />
        </TouchableOpacity>

        {!product.isAvailable ? (
          <View style={styles.outOfStockOverlay}>
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>AGOTADO</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {product.description || 'Sin descripción del platillo.'}
        </Text>

        {tagsPreview ? (
          <Text style={styles.tags} numberOfLines={1}>
            {tagsPreview}
          </Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.switchRow}>
          <Text style={styles.availableLabel}>Disponible</Text>
          <Switch
            value={product.isAvailable}
            onValueChange={onToggleAvailable}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={
              product.isAvailable ? colors.primary : colors.textMuted
            }
          />
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onPress} hitSlop={8} style={styles.actionBtn}>
            <Feather name="eye" size={16} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} style={styles.actionBtn}>
            <Feather name="trash-2" size={16} color={colors.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  imageWrap: {
    position: 'relative',
    height: 170,
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '100%', height: '100%' },
  categoryBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  categoryText: {
    fontSize: 10,
    color: colors.textOnPrimary,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  editBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 41, 55, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  outOfStockText: {
    color: colors.textOnPrimary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  content: { padding: spacing.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  name: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  price: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '800',
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
    minHeight: 54,
  },
  tags: {
    ...typography.caption,
    color: colors.primaryLight,
    marginTop: spacing.xs,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  availableLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
