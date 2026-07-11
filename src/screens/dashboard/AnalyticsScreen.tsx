/**
 * screens/dashboard/AnalyticsScreen.tsx
 * Analíticas derivadas de pedidos y productos reales.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { MetricCard } from '../../components/MetricCard';
import { useOrders } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';
import { ORDER_STATUS } from '../../utils/constants';
import { colors, radius, shadows, spacing, typography } from '../../utils/theme';

export function AnalyticsScreen() {
  const { orders, loading, refresh } = useOrders();
  const { products } = useProducts();

  const stats = useMemo(() => {
    const delivered = orders.filter(
      (o) => o.status === ORDER_STATUS.DELIVERED
    );
    const revenue = delivered.reduce((s, o) => s + o.total, 0);
    const avg =
      delivered.length > 0 ? revenue / delivered.length : 0;

    const productSales: Record<string, { name: string; qty: number; revenue: number }> =
      {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productId || item.name;
        if (!productSales[key]) {
          productSales[key] = { name: item.name, qty: 0, revenue: 0 };
        }
        productSales[key].qty += item.qty;
        productSales[key].revenue += item.subtotal || item.price * item.qty;
      });
    });

    const bestSellers = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      revenue,
      totalOrders: orders.length,
      avg,
      bestSellers,
      efficiency:
        orders.length === 0
          ? 100
          : Math.round(
              (delivered.length / Math.max(orders.length, 1)) * 100
            ),
    };
  }, [orders]);

  return (
    <ScreenShell searchPlaceholder="Buscar analíticas...">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <Text style={styles.title}>Analíticas detalladas</Text>
        <Text style={styles.subtitle}>
          Crecimiento y rendimiento de tu restaurante
        </Text>

        <View style={styles.grid}>
          <MetricCard
            label="Ingresos totales"
            value={`$${stats.revenue.toFixed(2)}`}
            accent
          />
          <MetricCard
            label="Pedidos totales"
            value={String(stats.totalOrders)}
          />
          <MetricCard
            label="Valor promedio"
            value={`$${stats.avg.toFixed(2)}`}
          />
          <MetricCard
            label="Eficiencia"
            value={`${stats.efficiency}%`}
            hint="Entregados / total"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Artículos más vendidos</Text>
          {stats.bestSellers.map((item, idx) => (
            <View key={`${item.name}-${idx}`} style={styles.row}>
              <View style={styles.rank}>
                <Text style={styles.rankText}>{idx + 1}</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  {item.qty} pedidos · ${item.revenue.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
          {stats.bestSellers.length === 0 ? (
            <Text style={styles.empty}>
              Aún no hay datos de ventas. Los pedidos entregados alimentarán
              esta lista.
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Menú</Text>
          <Text style={styles.rowMeta}>
            {products.length} productos activos en catálogo
          </Text>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: colors.primaryDark, fontWeight: '700' },
  rowText: { flex: 1 },
  rowName: { ...typography.body, fontWeight: '600', color: colors.text },
  rowMeta: { ...typography.caption, color: colors.textSecondary },
  empty: { ...typography.bodySmall, color: colors.textSecondary },
});
