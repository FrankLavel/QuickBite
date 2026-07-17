/**
 * components/ProductCard.tsx
 * Tarjeta de platillo estilo catálogo (mockup Menu Catalog).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Pressable } from 'react-native';
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

/** Colores de badge por categoría (determinista según el nombre). */
const CATEGORY_COLORS = [
  colors.primary,
  colors.info,
  '#DB2777',
  colors.warning,
  '#7C3AED',
  '#0891B2',
];

function categoryColor(name?: string): string {
  if (!name) return colors.primary;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}

export function ProductCard({
  product,
  categoryName,
  width,
  onPress,
  onToggleAvailable,
  onDelete,
}: ProductCardProps) {
  const available = product.isAvailable;

  return (
    <View style={[styles.card, width ? { width } : undefined]}>
      <View style={styles.imageWrap}>
        <ProductImage
          uri={product.imageURL}
          style={styles.image}
          dimmed={!available}
        />

        {categoryName ? (
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: categoryColor(categoryName) },
            ]}
          >
            <Text style={styles.categoryText}>{categoryName.toUpperCase()}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.editBtn}
          onPress={onPress}
          activeOpacity={0.85}
          accessibilityLabel="Editar platillo"
        >
          <Feather name="edit-2" size={15} color={colors.text} />
        </TouchableOpacity>

        {!available ? (
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

        <Text style={styles.description} numberOfLines={2}>
          {product.description || 'Sin descripción del platillo.'}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.switchRow}>
          <Switch
            value={available}
            onValueChange={onToggleAvailable}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={available ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.availableLabel,
              { color: available ? colors.primary : colors.textMuted },
            ]}
          >
            {available ? 'Disponible' : 'No disponible'}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onPress}
            hitSlop={8}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            accessibilityLabel="Ver / editar"
          >
            <Feather name="eye" size={17} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            accessibilityLabel="Eliminar platillo"
          >
            <Feather name="trash-2" size={17} color={colors.danger} />
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
    height: 168,
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '100%', height: '100%' },
  categoryBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    color: colors.textOnPrimary,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockBadge: {
    backgroundColor: colors.textSecondary,
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
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
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
    fontWeight: '700',
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
    minHeight: 36,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  availableLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPressed: {
    backgroundColor: colors.surfaceMuted,
  },
});
