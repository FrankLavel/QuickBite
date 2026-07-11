/**
 * screens/dashboard/CustomersScreen.tsx
 * Clientes derivados de orders.customerId (sin colección aparte de CRM).
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
import { useOrders } from '../../hooks/useOrders';
import { colors, radius, shadows, spacing, typography } from '../../utils/theme';

interface CustomerRow {
  id: string;
  orders: number;
  lifetimeValue: number;
  lastOrderId: string;
}

export function CustomersScreen() {
  const { orders, loading, refresh } = useOrders();

  const customers = useMemo(() => {
    const map = new Map<string, CustomerRow>();
    orders.forEach((order) => {
      const id = order.customerId || 'desconocido';
      const current = map.get(id) ?? {
        id,
        orders: 0,
        lifetimeValue: 0,
        lastOrderId: order.id,
      };
      current.orders += 1;
      current.lifetimeValue += order.total;
      current.lastOrderId = order.id;
      map.set(id, current);
    });
    return Array.from(map.values()).sort(
      (a, b) => b.lifetimeValue - a.lifetimeValue
    );
  }, [orders]);

  const avgOrder =
    customers.length > 0
      ? customers.reduce((s, c) => s + c.lifetimeValue, 0) /
        Math.max(
          customers.reduce((s, c) => s + c.orders, 0),
          1
        )
      : 0;

  return (
    <ScreenShell searchPlaceholder="Buscar clientes por ID...">
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        <Text style={styles.subtitle}>
          Resumen de lealtad basado en pedidos recibidos
        </Text>
        <View style={styles.metrics}>
          <MetricCard
            label="Total clientes"
            value={String(customers.length)}
            accent
          />
          <MetricCard
            label="Valor prom. pedido"
            value={`$${avgOrder.toFixed(2)}`}
          />
        </View>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Aún no hay clientes. Aparecerán cuando recibas pedidos.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.id.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>Cliente {item.id.slice(0, 8)}</Text>
              <Text style={styles.meta}>
                {item.orders} pedidos · ${item.lifetimeValue.toFixed(2)} valor
                total
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                item.orders >= 3 ? styles.badgeVip : styles.badgeRegular,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  item.orders >= 3
                    ? styles.badgeTextVip
                    : styles.badgeTextRegular,
                ]}
              >
                {item.orders >= 3 ? 'VIP' : 'REGULAR'}
              </Text>
            </View>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadows.card,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primaryDark, fontWeight: '700' },
  info: { flex: 1 },
  name: { ...typography.body, fontWeight: '600', color: colors.text },
  meta: { ...typography.caption, color: colors.textSecondary },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeVip: { backgroundColor: colors.primarySoft },
  badgeRegular: { backgroundColor: colors.infoSoft },
  badgeText: { ...typography.caption, fontWeight: '700' },
  badgeTextVip: { color: colors.primaryDark },
  badgeTextRegular: { color: colors.info },
  empty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
