/**
 * screens/dashboard/OrdersScreen.tsx
 * Pedidos en vivo: aceptar, preparar, listo, en camino.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { useOrders } from '../../hooks/useOrders';
import { ORDER_STATUS } from '../../utils/constants';
import type { Order, OrderStatus } from '../../types/order';
import { colors, radius, shadows, spacing, typography } from '../../utils/theme';
import { confirmAction } from '../../utils/confirm';

type Filter = 'activos' | 'programados' | 'listos';

export function OrdersScreen() {
  const { orders, loading, refresh, setStatus } = useOrders();
  const [filter, setFilter] = useState<Filter>('activos');

  const activeStatuses: OrderStatus[] = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY,
  ];

  const filtered = useMemo(() => {
    if (filter === 'listos') {
      return orders.filter((o) => o.status === ORDER_STATUS.READY);
    }
    if (filter === 'programados') {
      return orders.filter((o) => o.status === ORDER_STATUS.ACCEPTED);
    }
    return orders.filter((o) => activeStatuses.includes(o.status));
  }, [orders, filter]);

  const nextStatus = (status: OrderStatus): OrderStatus | null => {
    const flow: OrderStatus[] = [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.ACCEPTED,
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.READY,
      ORDER_STATUS.ON_THE_WAY,
      ORDER_STATUS.DELIVERED,
    ];
    const idx = flow.indexOf(status);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  const actionLabel = (status: OrderStatus): string => {
    const labels: Record<string, string> = {
      pending: 'Aceptar pedido',
      accepted: 'Enviar a cocina',
      preparing: 'Marcar listo',
      ready: 'En camino',
      on_the_way: 'Entregado',
    };
    return labels[status] ?? 'Actualizar';
  };

  const handleAdvance = async (order: Order) => {
    const next = nextStatus(order.status);
    if (!next) return;
    try {
      await setStatus(order.id, next, order.estimatedTime ?? 25);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el pedido');
    }
  };

  const handleReject = async (order: Order) => {
    const confirmed = await confirmAction(
      'Rechazar pedido',
      `¿Rechazar #${order.id.slice(0, 6)}?`,
      { confirmText: 'Rechazar', cancelText: 'Cancelar', destructive: true }
    );
    if (confirmed) {
      try {
        await setStatus(order.id, ORDER_STATUS.REJECTED);
      } catch {
        Alert.alert('Error', 'No se pudo rechazar el pedido');
      }
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <StatusBadge status={item.status} />
        <Text style={styles.total}>${item.total.toFixed(2)}</Text>
      </View>

      <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
      <Text style={styles.address}>
        {item.deliveryAddress.street}
        {item.deliveryAddress.city ? `, ${item.deliveryAddress.city}` : ''}
      </Text>

      {item.items.map((line, idx) => (
        <View key={`${item.id}-${idx}`} style={styles.itemBlock}>
          <Text style={styles.itemLine}>
            {line.qty}x {line.name}
          </Text>
          {line.toppings && line.toppings.length > 0 ? (
            <Text style={styles.itemToppings}>
              + {line.toppings.map((t) => t.name).join(', ')}
            </Text>
          ) : null}
          {line.notes ? (
            <Text style={styles.itemNote}>↳ {line.notes}</Text>
          ) : null}
        </View>
      ))}

      {item.specialInstructions ? (
        <Text style={styles.note}>“{item.specialInstructions}”</Text>
      ) : null}

      <View style={styles.actions}>
        {item.status === ORDER_STATUS.PENDING ? (
          <Button
            title="Rechazar"
            variant="outline"
            onPress={() => handleReject(item)}
            style={styles.actionBtn}
          />
        ) : null}
        {nextStatus(item.status) ? (
          <Button
            title={actionLabel(item.status)}
            onPress={() => handleAdvance(item)}
            style={styles.actionBtn}
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <ScreenShell searchPlaceholder="Buscar pedidos, clientes o artículos...">
      <View style={styles.header}>
        <Text style={styles.title}>Pedidos en vivo</Text>
        <Text style={styles.subtitle}>
          Gestiona la preparación y el despacho en tiempo real
        </Text>

        <View style={styles.tabs}>
          {(
            [
              ['activos', 'Activos'],
              ['programados', 'Programados'],
              ['listos', 'Listos'],
            ] as const
          ).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, filter === key && styles.tabActive]}
              onPress={() => setFilter(key)}
            >
              <Text
                style={[styles.tabText, filter === key && styles.tabTextActive]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No hay pedidos en esta vista.</Text>
        }
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  tabTextActive: { color: colors.textOnPrimary },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: { ...typography.h3, color: colors.primary },
  orderId: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  address: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  itemBlock: { marginBottom: spacing.xs },
  itemLine: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  itemToppings: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
  itemNote: {
    ...typography.caption,
    color: colors.primaryDark,
    fontStyle: 'italic',
    marginLeft: spacing.md,
  },
  note: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: { flex: 1 },
  empty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
