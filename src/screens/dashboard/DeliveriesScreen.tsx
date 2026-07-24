/**
 * screens/dashboard/DeliveriesScreen.tsx
 * Gestión de entregas — "board" profesional: filtros por estado, KPIs
 * operativos y tarjetas de entrega accionables. No hay entidad repartidor:
 * el restaurante marca "en camino" / "entregado".
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { UserAvatar } from '../../components/UserAvatar';
import { useOrders } from '../../hooks/useOrders';
import { ORDER_STATUS } from '../../utils/constants';
import type { Order, OrderStatus } from '../../types/order';
import { colors, radius, shadows, spacing, typography } from '../../utils/theme';
import { formatCurrency } from '../../utils/format';
import { notifyError } from '../../utils/notify';

type Filter = 'esperando' | 'en_camino' | 'entregadas';

function toDateSafe(v: unknown): Date | null {
  if (!v) return null;
  const anyV = v as { toDate?: () => Date; seconds?: number };
  if (typeof anyV.toDate === 'function') return anyV.toDate();
  if (typeof anyV.seconds === 'number') return new Date(anyV.seconds * 1000);
  if (typeof v === 'number') return new Date(v);
  if (typeof v === 'string') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function relTime(v: unknown): string {
  const d = toDateSafe(v);
  if (!d) return '';
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'hace un momento';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

function isToday(v: unknown): boolean {
  const d = toDateSafe(v);
  if (!d) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Acento (borde izquierdo) según estado de la entrega. */
const STATUS_ACCENT: Record<string, string> = {
  ready: colors.warning,
  on_the_way: colors.info,
  delivered: colors.success,
};

export function DeliveriesScreen() {
  const { orders, loading, refresh, setStatus } = useOrders();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<Filter>('esperando');
  const [searchQuery, setSearchQuery] = useState('');

  const groups = useMemo(() => {
    const waiting = orders.filter((o) => o.status === ORDER_STATUS.READY);
    const enRoute = orders.filter((o) => o.status === ORDER_STATUS.ON_THE_WAY);
    const delivered = orders
      .filter((o) => o.status === ORDER_STATUS.DELIVERED)
      .sort(
        (a, b) =>
          (toDateSafe(b.deliveredAt ?? b.createdAt)?.getTime() ?? 0) -
          (toDateSafe(a.deliveredAt ?? a.createdAt)?.getTime() ?? 0)
      );
    const deliveredToday = delivered.filter(
      (o) => isToday(o.deliveredAt) || isToday(o.createdAt)
    ).length;
    return { waiting, enRoute, delivered, deliveredToday };
  }, [orders]);

  const list = useMemo(() => {
    const base =
      filter === 'esperando'
        ? groups.waiting
        : filter === 'en_camino'
          ? groups.enRoute
          : groups.delivered;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        (o.customerName ?? '').toLowerCase().includes(q) ||
        (o.customerPhone ?? '').toLowerCase().includes(q) ||
        o.deliveryAddress.street.toLowerCase().includes(q) ||
        (o.deliveryAddress.city ?? '').toLowerCase().includes(q)
    );
  }, [filter, groups, searchQuery]);

  const tabs: [Filter, string, number][] = [
    ['esperando', 'Esperando salida', groups.waiting.length],
    ['en_camino', 'En camino', groups.enRoute.length],
    ['entregadas', 'Entregadas', groups.delivered.length],
  ];

  const handleAdvance = async (order: Order) => {
    const next: OrderStatus | null =
      order.status === ORDER_STATUS.READY
        ? ORDER_STATUS.ON_THE_WAY
        : order.status === ORDER_STATUS.ON_THE_WAY
          ? ORDER_STATUS.DELIVERED
          : null;
    if (!next) return;
    try {
      await setStatus(order.id, next);
    } catch {
      notifyError('No se pudo actualizar la entrega');
    }
  };

  const emptyCopy: Record<Filter, string> = {
    esperando: 'No hay pedidos listos esperando salir.',
    en_camino: 'Ninguna entrega en camino ahora mismo.',
    entregadas: 'Aún no hay entregas completadas.',
  };

  return (
    <ScreenShell
      searchPlaceholder="Buscar pedidos o direcciones..."
      onSearchChange={setSearchQuery}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <View style={styles.pageHead}>
          <Text style={styles.title}>Gestión de entregas</Text>
          <Text style={styles.subtitle}>
            Logística y seguimiento en tiempo real
          </Text>
        </View>

        <View style={styles.metrics}>
          <MetricCard
            label="Esperando salida"
            value={String(groups.waiting.length)}
            icon="clock"
            tone="warning"
            badge={groups.waiting.length > 0 ? 'Por despachar' : undefined}
            badgeTone="priority"
          />
          <MetricCard
            label="En camino"
            value={String(groups.enRoute.length)}
            icon="truck"
            tone="info"
            badge={groups.enRoute.length > 0 ? 'En vivo' : undefined}
            badgeTone="live"
          />
          <MetricCard
            label="Entregadas hoy"
            value={String(groups.deliveredToday)}
            icon="check-circle"
            tone="success"
          />
        </View>

        <View style={styles.tabs}>
          {tabs.map(([key, label, count]) => {
            const active = filter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setFilter(key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {label}
                </Text>
                <View
                  style={[styles.tabCount, active && styles.tabCountActive]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      active && styles.tabCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {list.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="truck" size={26} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>{emptyCopy[filter]}</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {list.map((order) => (
              <DeliveryCard
                key={order.id}
                order={order}
                onAdvance={() => handleAdvance(order)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

function DeliveryCard({
  order,
  onAdvance,
}: {
  order: Order;
  onAdvance: () => void;
}) {
  const accent = STATUS_ACCENT[order.status] ?? colors.border;
  const customer =
    order.customerName ?? `Cliente ${order.customerId.slice(0, 6)}`;
  const isDelivered = order.status === ORDER_STATUS.DELIVERED;
  const timeRef = isDelivered ? order.deliveredAt : order.createdAt;
  const timeLabel = isDelivered
    ? `Entregado ${relTime(order.deliveredAt) || 'recientemente'}`
    : `Pedido ${relTime(order.createdAt) || 'reciente'}`;
  const actionLabel =
    order.status === ORDER_STATUS.READY
      ? 'Marcar en camino'
      : order.status === ORDER_STATUS.ON_THE_WAY
        ? 'Marcar entregado'
        : null;

  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardHead}>
          <Text style={styles.orderId}>
            #{order.id.slice(0, 6).toUpperCase()}
          </Text>
          <Text style={styles.orderTime}>{timeLabel}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.customerRow}>
        <UserAvatar name={customer} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={styles.customerName} numberOfLines={1}>
            {customer}
          </Text>
          {order.customerPhone ? (
            <View style={styles.inlineRow}>
              <Feather name="phone" size={11} color={colors.primary} />
              <Text style={styles.phone}>{order.customerPhone}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.total}>{formatCurrency(order.total)}</Text>
      </View>

      <View style={styles.addressRow}>
        <Feather name="map-pin" size={13} color={colors.textSecondary} />
        <Text style={styles.address} numberOfLines={2}>
          {order.deliveryAddress.street}
          {order.deliveryAddress.city
            ? `, ${order.deliveryAddress.city}`
            : ''}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Feather name="shopping-bag" size={12} color={colors.textSecondary} />
          <Text style={styles.metaChipText}>
            {order.items.reduce((s, i) => s + i.qty, 0)} artículos
          </Text>
        </View>
        {order.estimatedTime ? (
          <View style={styles.metaChip}>
            <Feather name="clock" size={12} color={colors.textSecondary} />
            <Text style={styles.metaChipText}>~{order.estimatedTime} min</Text>
          </View>
        ) : null}
      </View>

      {actionLabel ? (
        <Button title={actionLabel} onPress={onAdvance} style={styles.btn} />
      ) : (
        <View style={styles.doneRow}>
          <Feather name="check-circle" size={14} color={colors.success} />
          <Text style={styles.doneText}>Entrega completada</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  pageHead: {},
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { ...typography.bodySmall, color: colors.text, fontWeight: '700' },
  tabTextActive: { color: colors.textOnPrimary },
  tabCount: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  tabCountTextActive: { color: colors.textOnPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: {
    flexGrow: 1,
    flexBasis: 340,
    minWidth: 280,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: spacing.md,
    ...shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardHead: { flex: 1 },
  orderId: { ...typography.body, color: colors.text, fontWeight: '800' },
  orderTime: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  customerName: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  phone: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  total: { ...typography.h3, color: colors.text, fontWeight: '800' },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.md,
  },
  address: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  metaChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  btn: { marginTop: spacing.md },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  doneText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
