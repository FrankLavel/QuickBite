/**
 * screens/dashboard/HomeScreen.tsx
 * Panel / Resumen (mockup Overview) en español.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';
import { ORDER_STATUS } from '../../utils/constants';
import { colors, radius, shadows, spacing, typography } from '../../utils/theme';

export function HomeScreen() {
  const { restaurant } = useAuth();
  const { orders, loading, refresh } = useOrders();
  const { products } = useProducts();

  const pending = orders.filter((o) => o.status === ORDER_STATUS.PENDING).length;
  const preparing = orders.filter(
    (o) =>
      o.status === ORDER_STATUS.PREPARING || o.status === ORDER_STATUS.ACCEPTED
  ).length;
  const onTheWay = orders.filter(
    (o) => o.status === ORDER_STATUS.ON_THE_WAY
  ).length;
  const revenue = orders
    .filter((o) => o.status === ORDER_STATUS.DELIVERED)
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <ScreenShell searchPlaceholder="Buscar pedidos, menús o clientes...">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <Text style={styles.title}>Resumen</Text>
        <Text style={styles.subtitle}>
          ¡Bienvenido de nuevo! Esto es lo que está pasando en{' '}
          {restaurant?.name ?? 'tu restaurante'} hoy.
        </Text>

        <View style={styles.grid}>
          <MetricCard
            label="Pedidos totales"
            value={String(orders.length)}
            hint={`${pending} pendientes`}
          />
          <MetricCard
            label="Ingresos"
            value={`$${revenue.toFixed(0)}`}
            accent
          />
          <MetricCard
            label="Entregas activas"
            value={String(onTheWay)}
            hint="En vivo"
          />
          <MetricCard
            label="Pedidos pendientes"
            value={String(pending)}
            danger={pending > 0}
            hint={pending > 0 ? 'Prioridad' : undefined}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actividad reciente</Text>
          {orders.slice(0, 5).map((order) => (
            <View key={order.id} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>Pedido #{order.id.slice(0, 6)}</Text>
                <Text style={styles.rowMeta}>
                  {order.items.length} artículos · ${order.total.toFixed(2)}
                </Text>
              </View>
              <StatusBadge status={order.status} />
            </View>
          ))}
          {orders.length === 0 ? (
            <Text style={styles.empty}>
              Aún no hay pedidos. Cuando los clientes ordenen, aparecerán aquí.
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Menú en un vistazo</Text>
          <Text style={styles.rowMeta}>
            {products.length} productos ·{' '}
            {products.filter((p) => p.isAvailable).length} disponibles ·{' '}
            {preparing} en cocina
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
    marginTop: spacing.xs,
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
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowText: { flex: 1 },
  rowName: { ...typography.body, color: colors.text, fontWeight: '600' },
  rowMeta: { ...typography.caption, color: colors.textSecondary },
  empty: { ...typography.bodySmall, color: colors.textSecondary },
});
