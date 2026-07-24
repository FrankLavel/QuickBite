/**
 * screens/dashboard/MenuScreen.tsx
 * Catálogo de menú — grid de platillos estilo mockup.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { ProductCard } from '../../components/ProductCard';
import { AddProductCard } from '../../components/AddProductCard';
import { MetricCard } from '../../components/MetricCard';
import { Button } from '../../components/Button';
import { useProducts } from '../../hooks/useProducts';
import type { Product } from '../../types/product';
import type { RootStackParamList } from '../../types/navigation';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { confirmAction } from '../../utils/confirm';
import { formatCurrency, formatNumber } from '../../utils/format';
import { notifyError, notifyInfo } from '../../utils/notify';

type ListItem = { type: 'product'; data: Product } | { type: 'add' };

export function MenuScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const {
    products,
    categories,
    loading,
    refresh,
    toggleAvailability,
    removeProduct,
  } = useProducts();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const numColumns =
    width >= 1280 ? 4 : width >= 1000 ? 3 : width >= 680 ? 2 : 1;
  const horizontalPadding = spacing.md * 2;
  const gap = spacing.md;
  const cardWidth =
    (width - horizontalPadding - gap * (numColumns - 1)) / numColumns;

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    let list = products;
    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.categoryId === categoryFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          (categoryMap[p.categoryId] ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, categoryFilter, searchQuery, categoryMap]);

  const listData: ListItem[] = useMemo(
    () => [
      ...filtered.map((p) => ({ type: 'product' as const, data: p })),
      { type: 'add' as const },
    ],
    [filtered]
  );

  const outOfStock = products.filter((p) => !p.isAvailable).length;
  const avgPrice =
    products.length > 0
      ? products.reduce((s, p) => s + p.price, 0) / products.length
      : 0;

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmAction(
      'Eliminar producto',
      `¿Eliminar "${name}"?`,
      { confirmText: 'Eliminar', cancelText: 'Cancelar', destructive: true }
    );
    if (confirmed) {
      try {
        await removeProduct(id);
      } catch {
        notifyError('No se pudo eliminar el producto');
      }
    }
  };

  const openNewProduct = () => navigation.navigate('ProductForm', {});

  return (
    <ScreenShell
      searchPlaceholder="Buscar platillos, ingredientes o categorías..."
      onSearchChange={setSearchQuery}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Catálogo de menú</Text>
            <Text style={styles.subtitle}>
              Gestiona platillos, precios y disponibilidad en tiempo real
            </Text>
          </View>
          <View style={styles.actions}>
            <Button
              title="Filtros"
              variant="outline"
              onPress={() =>
                notifyInfo(
                  'Usa las pestañas de categoría debajo para filtrar el menú.',
                  'Filtros'
                )
              }
              style={styles.actionBtn}
            />
            <Button
              title="Exportar PDF"
              variant="outline"
              onPress={() =>
                notifyInfo(
                  'La exportación a PDF estará disponible en una próxima versión.',
                  'Próximamente'
                )
              }
              style={styles.actionBtn}
            />
            <Button
              title="+ Nuevo platillo"
              onPress={openNewProduct}
              style={styles.actionBtn}
            />
          </View>
        </View>

        <View style={styles.metrics}>
          <MetricCard
            variant="compact"
            label="Total platillos"
            value={formatNumber(products.length)}
            icon="grid"
            tone="primary"
          />
          <MetricCard
            variant="compact"
            label="Categorías activas"
            value={formatNumber(categories.length)}
            icon="layers"
            tone="info"
          />
          <MetricCard
            variant="compact"
            label="Agotados"
            value={formatNumber(outOfStock)}
            icon={outOfStock > 0 ? undefined : 'check-circle'}
            tone={outOfStock > 0 ? 'danger' : 'success'}
            danger={outOfStock > 0}
            hint={outOfStock > 0 ? 'Requiere atención' : undefined}
          />
          <MetricCard
            variant="compact"
            label="Precio promedio"
            value={formatCurrency(avgPrice)}
            icon="tag"
            tone="success"
          />
        </View>

        <View style={styles.tabsWrap}>
          <FlatList
            horizontal
            data={[{ id: 'all', name: 'Todos' }, ...categories]}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            renderItem={({ item }) => {
              const active = categoryFilter === item.id;
              return (
                <TouchableOpacity
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategoryFilter(item.id)}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>

      <FlatList
        key={`menu-grid-${numColumns}`}
        data={listData}
        numColumns={numColumns}
        keyExtractor={(item, index) =>
          item.type === 'product' ? item.data.id : `add-${index}`
        }
        columnWrapperStyle={numColumns > 1 ? styles.columnWrap : undefined}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Sin productos aún</Text>
              <Text style={styles.emptyText}>
                Agrega tu primer platillo con el botón de arriba o la tarjeta
                punteada.
              </Text>
              <Button
                title="+ Agregar primer platillo"
                onPress={openNewProduct}
                style={styles.emptyBtn}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.type === 'add') {
            return (
              <AddProductCard width={cardWidth} onPress={openNewProduct} />
            );
          }

          const product = item.data;
          return (
            <ProductCard
              product={product}
              categoryName={categoryMap[product.categoryId]}
              width={cardWidth}
              onPress={() =>
                navigation.navigate('ProductForm', { productId: product.id })
              }
              onToggleAvailable={(value) =>
                toggleAvailability(product.id, value)
              }
              onDelete={() => handleDelete(product.id, product.name)}
            />
          );
        }}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titleBlock: { flex: 1, minWidth: 220 },
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  actionBtn: { minWidth: 120 },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabsWrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  chips: { gap: spacing.xs, paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginRight: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  chipTextActive: { color: colors.textOnPrimary },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  columnWrap: {
    gap: spacing.md,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: { ...typography.h3, color: colors.text },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyBtn: { minWidth: 220 },
});
