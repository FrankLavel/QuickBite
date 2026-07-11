/**
 * screens/dashboard/NotificationsScreen.tsx
 * Centro de notificaciones del restaurante (derivado de pedidos recientes).
 * La subcolección users/{uid}/notifications es principalmente del cliente;
 * aquí mostramos alertas operativas del dashboard.
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
import { useOrders } from '../../hooks/useOrders';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../utils/constants';
import { colors, radius, shadows, spacing, typography } from '../../utils/theme';

interface AlertItem {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'system';
}

export function NotificationsScreen() {
  const { orders, loading, refresh } = useOrders();

  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = orders.slice(0, 20).map((order) => ({
      id: order.id,
      type: 'order',
      title: `Pedido #${order.id.slice(0, 6).toUpperCase()}`,
      body: `Estado: ${ORDER_STATUS_LABELS[order.status] ?? order.status} · $${order.total.toFixed(2)}`,
    }));

    const pending = orders.filter((o) => o.status === ORDER_STATUS.PENDING);
    if (pending.length > 0) {
      items.unshift({
        id: 'pending-alert',
        type: 'system',
        title: 'Pedidos pendientes',
        body: `Tienes ${pending.length} pedido(s) esperando aceptación.`,
      });
    }

    return items;
  }, [orders]);

  return (
    <ScreenShell searchPlaceholder="Buscar alertas o pedidos...">
      <View style={styles.header}>
        <Text style={styles.title}>Centro de notificaciones</Text>
        <Text style={styles.subtitle}>
          Alertas de pedidos y comunicaciones del sistema
        </Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No hay notificaciones por ahora.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View
              style={[
                styles.icon,
                item.type === 'order' ? styles.iconOrder : styles.iconSystem,
              ]}
            >
              <Text>{item.type === 'order' ? '🧾' : '⚠️'}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
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
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOrder: { backgroundColor: colors.primarySoft },
  iconSystem: { backgroundColor: colors.warningSoft },
  content: { flex: 1 },
  cardTitle: { ...typography.body, fontWeight: '700', color: colors.text },
  body: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  empty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
