/**
 * screens/dashboard/OrdersScreen.tsx
 * Pedidos en vivo — "live board" profesional: tarjetas de pedido, cocina y
 * estadísticas operativas. Solo datos reales (sin repartidor/mapa).
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { UserAvatar } from '../../components/UserAvatar';
import { useOrders } from '../../hooks/useOrders';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../utils/constants';
import type { Order, OrderStatus } from '../../types/order';
import { colors, radius, shadows, spacing, typography } from '../../utils/theme';
import { confirmAction } from '../../utils/confirm';

type Filter = 'activos' | 'programados' | 'listos';

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

function paymentInfo(o: Order): { text: string; bg: string; fg: string } {
  if (o.paymentStatus === 'paid')
    return { text: 'Pagado', bg: colors.successSoft, fg: colors.success };
  if (o.paymentMethod === 'cash')
    return { text: 'Efectivo', bg: colors.warningSoft, fg: colors.warning };
  return { text: 'Pago pendiente', bg: colors.surfaceMuted, fg: colors.textSecondary };
}

const FLOW: OrderStatus[] = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.ON_THE_WAY,
  ORDER_STATUS.DELIVERED,
];

function nextStatus(status: OrderStatus): OrderStatus | null {
  const idx = FLOW.indexOf(status);
  return idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
}

function actionLabel(status: OrderStatus): string {
  const labels: Record<string, string> = {
    pending: 'Aceptar pedido',
    accepted: 'Enviar a cocina',
    preparing: 'Marcar listo',
    ready: 'En camino',
    on_the_way: 'Entregado',
  };
  return labels[status] ?? 'Actualizar';
}

const DOT_COLORS: Record<string, string> = {
  pending: colors.danger,
  accepted: colors.info,
  preparing: colors.primary,
  ready: colors.success,
  on_the_way: colors.info,
  delivered: colors.textMuted,
  rejected: colors.danger,
  cancelled: colors.danger,
};

export function OrdersScreen() {
  const { orders, loading, refresh, setStatus } = useOrders();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const [filter, setFilter] = useState<Filter>('activos');

  const groups = useMemo(() => {
    const active = orders.filter((o) =>
      (
        [
          ORDER_STATUS.PENDING,
          ORDER_STATUS.ACCEPTED,
          ORDER_STATUS.PREPARING,
          ORDER_STATUS.READY,
        ] as OrderStatus[]
      ).includes(o.status)
    );
    const scheduled = orders.filter((o) => o.status === ORDER_STATUS.ACCEPTED);
    const ready = orders.filter((o) => o.status === ORDER_STATUS.READY);
    const preparing = orders.filter(
      (o) => o.status === ORDER_STATUS.PREPARING
    );
    const delivered = orders.filter(
      (o) => o.status === ORDER_STATUS.DELIVERED
    );
    const closed = orders.filter((o) =>
      (
        [
          ORDER_STATUS.DELIVERED,
          ORDER_STATUS.REJECTED,
          ORDER_STATUS.CANCELLED,
        ] as OrderStatus[]
      ).includes(o.status)
    );
    const successRate =
      closed.length > 0
        ? Math.round((delivered.length / closed.length) * 100)
        : 100;
    return { active, scheduled, ready, preparing, delivered, successRate };
  }, [orders]);

  const filtered =
    filter === 'listos'
      ? groups.ready
      : filter === 'programados'
        ? groups.scheduled
        : groups.active;

  const recentLog = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            (toDateSafe(b.createdAt)?.getTime() ?? 0) -
            (toDateSafe(a.createdAt)?.getTime() ?? 0)
        )
        .slice(0, 6),
    [orders]
  );

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
    if (!confirmed) return;
    try {
      await setStatus(order.id, ORDER_STATUS.REJECTED);
    } catch {
      Alert.alert('Error', 'No se pudo rechazar el pedido');
    }
  };

  const tabs: [Filter, string, number][] = [
    ['activos', 'Activos', groups.active.length],
    ['programados', 'Programados', groups.scheduled.length],
    ['listos', 'Listos', groups.ready.length],
  ];

  return (
    <ScreenShell searchPlaceholder="Buscar pedidos, clientes o artículos...">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <View style={styles.pageHead}>
          <View style={styles.pageHeadText}>
            <Text style={styles.title}>Pedidos en vivo</Text>
            <Text style={styles.subtitle}>
              Gestiona la preparación y el despacho en tiempo real
            </Text>
          </View>
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
                <View style={[styles.tabCount, active && styles.tabCountActive]}>
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

        <View style={[styles.columns, wide && styles.columnsRow]}>
          {/* IZQUIERDA: tarjetas + preparando */}
          <View style={wide ? styles.colMain : undefined}>
            <View style={styles.cardsGrid}>
              {filtered.length === 0 ? (
                <SectionCard>
                  <Text style={styles.empty}>
                    No hay pedidos en esta vista.
                  </Text>
                </SectionCard>
              ) : (
                filtered.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAdvance={() => handleAdvance(order)}
                    onReject={() => handleReject(order)}
                  />
                ))
              )}
            </View>

            <SectionCard
              title={`Preparando ahora (${groups.preparing.length})`}
              subtitle="Pedidos en cocina"
              style={styles.prepCard}
            >
              {groups.preparing.length === 0 ? (
                <Text style={styles.empty}>Nada en cocina por ahora.</Text>
              ) : (
                <View style={styles.prepGrid}>
                  {groups.preparing.map((o) => (
                    <View key={o.id} style={styles.prepItem}>
                      <View style={styles.prepIcon}>
                        <Feather name="clock" size={14} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.prepId}>
                          #{o.id.slice(0, 6).toUpperCase()}
                        </Text>
                        <Text style={styles.prepMeta} numberOfLines={1}>
                          {o.items.reduce((s, i) => s + i.qty, 0)} artículos ·
                          ${o.total.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>
          </View>

          {/* DERECHA: stats + registro */}
          <View style={wide ? styles.colSide : undefined}>
            <SectionCard title="Estadísticas operativas" style={styles.sideCard}>
              <View style={styles.statRow}>
                <StatTile label="Activos" value={String(groups.active.length)} tone="info" />
                <StatTile label="En cocina" value={String(groups.preparing.length)} tone="primary" />
              </View>
              <View style={styles.statRow}>
                <StatTile label="Entregados" value={String(groups.delivered.length)} tone="neutral" />
                <StatTile label="Tasa de éxito" value={`${groups.successRate}%`} tone="success" />
              </View>
            </SectionCard>

            <SectionCard title="Actividad reciente" style={styles.sideCard}>
              {recentLog.length === 0 ? (
                <Text style={styles.empty}>Sin actividad todavía.</Text>
              ) : (
                recentLog.map((o) => (
                  <View key={o.id} style={styles.logRow}>
                    <View
                      style={[
                        styles.logDot,
                        { backgroundColor: DOT_COLORS[o.status] ?? colors.textMuted },
                      ]}
                    />
                    <Text style={styles.logText} numberOfLines={1}>
                      #{o.id.slice(0, 6).toUpperCase()} ·{' '}
                      {ORDER_STATUS_LABELS[o.status] ?? o.status}
                    </Text>
                    <Text style={styles.logTime}>{relTime(o.createdAt)}</Text>
                  </View>
                ))
              )}
            </SectionCard>
          </View>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

function OrderCard({
  order,
  onAdvance,
  onReject,
}: {
  order: Order;
  onAdvance: () => void;
  onReject: () => void;
}) {
  const pay = paymentInfo(order);
  const isPending = order.status === ORDER_STATUS.PENDING;
  const customer =
    order.customerName ?? `Cliente ${order.customerId.slice(0, 6)}`;
  const next = nextStatus(order.status);

  return (
    <View style={[styles.orderCard, isPending && styles.orderCardUrgent]}>
      <View style={styles.orderTop}>
        <StatusBadge status={order.status} />
        <View style={styles.orderTopRight}>
          <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
          <View style={[styles.payBadge, { backgroundColor: pay.bg }]}>
            <Text style={[styles.payText, { color: pay.fg }]}>{pay.text}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
      <Text style={styles.orderTime}>
        Pedido {relTime(order.createdAt) || 'reciente'}
      </Text>

      <View style={styles.customerRow}>
        <UserAvatar name={customer} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={styles.customerName} numberOfLines={1}>
            {customer}
          </Text>
          <Text style={styles.customerAddr} numberOfLines={1}>
            {order.deliveryAddress.street}
            {order.deliveryAddress.city ? `, ${order.deliveryAddress.city}` : ''}
          </Text>
          {order.customerPhone ? (
            <View style={styles.phoneRow}>
              <Feather name="phone" size={11} color={colors.primary} />
              <Text style={styles.customerPhone}>{order.customerPhone}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.itemsBox}>
        {order.items.map((line, idx) => (
          <View key={`${order.id}-${idx}`}>
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
      </View>

      {order.specialInstructions ? (
        <Text style={styles.special}>“{order.specialInstructions}”</Text>
      ) : null}

      <View style={styles.orderFooter}>
        {order.estimatedTime ? (
          <View style={styles.etaChip}>
            <Feather name="clock" size={12} color={colors.textSecondary} />
            <Text style={styles.etaText}>~{order.estimatedTime} min</Text>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.orderActions}>
          {isPending ? (
            <Button
              title="Rechazar"
              variant="outline"
              onPress={onReject}
              style={styles.rejectBtn}
            />
          ) : null}
          {next ? (
            <Button
              title={actionLabel(order.status)}
              onPress={onAdvance}
              style={styles.advanceBtn}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'primary' | 'info' | 'success' | 'neutral';
}) {
  const fg =
    tone === 'primary'
      ? colors.primary
      : tone === 'info'
        ? colors.info
        : tone === 'success'
          ? colors.success
          : colors.text;
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statValue, { color: fg }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  pageHead: { flexDirection: 'row', justifyContent: 'space-between' },
  pageHeadText: { flex: 1 },
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
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
  tabCountText: { ...typography.caption, color: colors.textSecondary, fontWeight: '800' },
  tabCountTextActive: { color: colors.textOnPrimary },
  columns: { gap: spacing.md },
  columnsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  colMain: { flex: 2, gap: spacing.md },
  colSide: { flex: 1, minWidth: 280, gap: spacing.md },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  orderCard: {
    flexGrow: 1,
    flexBasis: 320,
    minWidth: 280,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  orderCardUrgent: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderTopRight: { alignItems: 'flex-end', gap: 4 },
  orderTotal: { ...typography.h3, color: colors.text, fontWeight: '800' },
  payBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  payText: { ...typography.caption, fontWeight: '700', fontSize: 10 },
  orderId: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  orderTime: { ...typography.caption, color: colors.textMuted },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  customerName: { ...typography.bodySmall, color: colors.text, fontWeight: '700' },
  customerAddr: { ...typography.caption, color: colors.textSecondary },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  customerPhone: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  itemsBox: { marginTop: spacing.md, gap: 2 },
  itemLine: { ...typography.bodySmall, color: colors.text },
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
  special: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  etaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  etaText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  orderActions: { flexDirection: 'row', gap: spacing.sm, flex: 1, justifyContent: 'flex-end' },
  rejectBtn: { minWidth: 90 },
  advanceBtn: { minWidth: 120 },
  prepCard: {},
  prepGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  prepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexGrow: 1,
    flexBasis: 200,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  prepIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prepId: { ...typography.bodySmall, color: colors.text, fontWeight: '700' },
  prepMeta: { ...typography.caption, color: colors.textSecondary },
  sideCard: {},
  statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statTile: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  statValue: { ...typography.h2, fontWeight: '800' },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logText: { ...typography.caption, color: colors.text, flex: 1, fontWeight: '600' },
  logTime: { ...typography.caption, color: colors.textMuted },
  empty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.md,
  },
});
