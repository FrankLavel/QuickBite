/**
 * screens/dashboard/DeliveriesScreen.tsx
 * Gestión de entregas (pedidos ready / on_the_way / delivered).
 * No hay entidad repartidor: el restaurante marca "en camino".
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { useOrders } from '../../hooks/useOrders';
import { ORDER_STATUS } from '../../utils/constants';
import type { Order, OrderStatus } from '../../types/order';
import { colors, radius, shadows, spacing, typography } from '../../utils/theme';

export function DeliveriesScreen() {
  const { orders, loading, refresh, setStatus } = useOrders();

  const deliveryStatuses: OrderStatus[] = [
    ORDER_STATUS.READY,
    ORDER_STATUS.ON_THE_WAY,
    ORDER_STATUS.DELIVERED,
  ];

  const deliveries = useMemo(
    () => orders.filter((o) => deliveryStatuses.includes(o.status)),
    [orders]
  );

  const active = deliveries.filter(
    (o) => o.status === ORDER_STATUS.ON_THE_WAY
  ).length;
  const waiting = deliveries.filter(
    (o) => o.status === ORDER_STATUS.READY
  ).length;

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.id}>#{item.id.slice(0, 6).toUpperCase()}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.address}>
        {item.deliveryAddress.street}, {item.deliveryAddress.city}
      </Text>
      <Text style={styles.meta}>
        {item.items.length} artículos · ${item.total.toFixed(2)}
      </Text>

      {item.status === ORDER_STATUS.READY ? (
        <Button
          title="Marcar en camino"
          onPress={() => setStatus(item.id, ORDER_STATUS.ON_THE_WAY)}
          style={styles.btn}
        />
      ) : null}
      {item.status === ORDER_STATUS.ON_THE_WAY ? (
        <Button
          title="Marcar entregado"
          onPress={() => setStatus(item.id, ORDER_STATUS.DELIVERED)}
          style={styles.btn}
        />
      ) : null}
    </View>
  );

  return (
    <ScreenShell searchPlaceholder="Buscar pedidos o direcciones...">
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de entregas</Text>
        <Text style={styles.subtitle}>
          Logística y seguimiento en tiempo real
        </Text>
        <View style={styles.metrics}>
          <MetricCard label="Entregas activas" value={String(active)} accent />
          <MetricCard label="Esperando salida" value={String(waiting)} />
        </View>
      </View>

      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No hay entregas activas.</Text>
        }
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, paddingBottom: 0 },
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  metrics: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  id: { ...typography.body, fontWeight: '700', color: colors.text },
  address: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  btn: { marginTop: spacing.md },
  empty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
