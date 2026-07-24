/**
 * screens/dashboard/HomeScreen.tsx
 * Panel / Resumen (Overview) — versión profesional:
 * KPIs, rendimiento de ventas (gráfico real), actividad reciente y tabla de pedidos.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { MetricCard } from '../../components/MetricCard';
import { SectionCard } from '../../components/SectionCard';
import { MiniBarChart, type BarPoint } from '../../components/MiniBarChart';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';
import { ORDER_STATUS } from '../../utils/constants';
import type { Order } from '../../types/order';
import { colors, radius, spacing, typography } from '../../utils/theme';
import {
  computeDelta,
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  formatPercent,
} from '../../utils/format';

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

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(d: Date, ref: Date): number {
  return Math.floor(
    (startOfDay(ref).getTime() - startOfDay(d).getTime()) / 86400000
  );
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function buildSeries(orders: Order[], mode: 'week' | 'month'): BarPoint[] {
  const now = new Date();
  if (mode === 'week') {
    return [6, 5, 4, 3, 2, 1, 0].map((i) => {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const value = orders.filter((o) => {
        const od = toDateSafe(o.createdAt);
        return od != null && daysAgo(od, now) === i;
      }).length;
      return { label: WEEKDAYS[day.getDay()], value };
    });
  }
  const buckets = [0, 0, 0, 0];
  orders.forEach((o) => {
    const od = toDateSafe(o.createdAt);
    if (!od) return;
    const ago = daysAgo(od, now);
    if (ago >= 0 && ago < 28) buckets[Math.floor(ago / 7)] += 1;
  });
  return [
    { label: 'Hace 3 sem.', value: buckets[3] },
    { label: 'Hace 2 sem.', value: buckets[2] },
    { label: 'Sem. pasada', value: buckets[1] },
    { label: 'Esta sem.', value: buckets[0] },
  ];
}

export function HomeScreen() {
  const { restaurant } = useAuth();
  const { orders, loading, refresh } = useOrders();
  const { products } = useProducts();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;

  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const stats = useMemo(() => {
    const pending = orders.filter(
      (o) => o.status === ORDER_STATUS.PENDING
    ).length;
    const preparing = orders.filter(
      (o) =>
        o.status === ORDER_STATUS.PREPARING ||
        o.status === ORDER_STATUS.ACCEPTED
    ).length;
    const onTheWay = orders.filter(
      (o) => o.status === ORDER_STATUS.ON_THE_WAY
    ).length;
    const delivered = orders.filter(
      (o) => o.status === ORDER_STATUS.DELIVERED
    );
    const cancelled = orders.filter(
      (o) => o.status === ORDER_STATUS.CANCELLED
    ).length;
    const revenue = delivered.reduce((s, o) => s + o.total, 0);
    const avgOrder = delivered.length > 0 ? revenue / delivered.length : 0;
    const cancelRate =
      orders.length > 0 ? (cancelled / orders.length) * 100 : 0;

    // Tendencias semana-a-semana: esta semana (días 0-6) vs. anterior (7-13).
    const now = new Date();
    const inWeek = (o: Order, from: number, to: number): boolean => {
      const od = toDateSafe(o.createdAt);
      if (!od) return false;
      const ago = daysAgo(od, now);
      return ago >= from && ago <= to;
    };
    const ordersThisWeek = orders.filter((o) => inWeek(o, 0, 6)).length;
    const ordersLastWeek = orders.filter((o) => inWeek(o, 7, 13)).length;
    const revThisWeek = delivered
      .filter((o) => inWeek(o, 0, 6))
      .reduce((s, o) => s + o.total, 0);
    const revLastWeek = delivered
      .filter((o) => inWeek(o, 7, 13))
      .reduce((s, o) => s + o.total, 0);

    const series = buildSeries(orders, period);
    const peak = series.reduce(
      (best, p) => (p.value > best.value ? p : best),
      { label: '—', value: 0 }
    );

    return {
      pending,
      preparing,
      onTheWay,
      revenue,
      avgOrder,
      cancelRate,
      series,
      peakLabel: peak.value > 0 ? peak.label : '—',
      ordersTrend: computeDelta(ordersThisWeek, ordersLastWeek),
      revenueTrend: computeDelta(revThisWeek, revLastWeek),
    };
  }, [orders, period]);

  const activity = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const da = toDateSafe(a.createdAt)?.getTime() ?? 0;
        const db = toDateSafe(b.createdAt)?.getTime() ?? 0;
        return db - da;
      })
      .slice(0, 5);
  }, [orders]);

  const recent = useMemo(() => orders.slice(0, 6), [orders]);

  return (
    <ScreenShell searchPlaceholder="Buscar pedidos, menús o clientes...">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <View style={styles.pageHead}>
          <View style={styles.pageHeadText}>
            <Text style={styles.title}>Resumen</Text>
            <Text style={styles.subtitle}>
              ¡Bienvenido de nuevo! Esto es lo que está pasando en{' '}
              {restaurant?.name ?? 'tu restaurante'} hoy.
            </Text>
          </View>
          <View style={styles.rangePill}>
            <Feather name="calendar" size={14} color={colors.textSecondary} />
            <Text style={styles.rangePillText}>
              {period === 'week' ? 'Últimos 7 días' : 'Últimos 28 días'}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <MetricCard
            label="Pedidos totales"
            value={formatNumber(orders.length)}
            icon="shopping-bag"
            tone="primary"
            trend={{ ...stats.ordersTrend, label: 'vs. semana pasada' }}
          />
          <MetricCard
            label="Ingresos"
            value={formatCurrencyCompact(stats.revenue)}
            icon="dollar-sign"
            tone="success"
            trend={{ ...stats.revenueTrend, label: 'vs. semana pasada' }}
          />
          <MetricCard
            label="Entregas activas"
            value={String(stats.onTheWay)}
            icon="truck"
            tone="info"
            badge="En vivo"
            badgeTone="live"
          />
          <MetricCard
            label="Pedidos pendientes"
            value={String(stats.pending)}
            icon="clock"
            tone="danger"
            danger={stats.pending > 0}
            badge={stats.pending > 0 ? 'Prioridad' : undefined}
            badgeTone="priority"
          />
        </View>

        <View style={[styles.columns, wide && styles.columnsRow]}>
          <View style={wide ? styles.colMain : undefined}>
            <SectionCard
              title="Rendimiento de ventas"
              subtitle="Pedidos recibidos por periodo"
              action={
                <View style={styles.segment}>
                  {(
                    [
                      ['week', 'Semana'],
                      ['month', 'Mes'],
                    ] as const
                  ).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.segmentBtn,
                        period === key && styles.segmentBtnActive,
                      ]}
                      onPress={() => setPeriod(key)}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          period === key && styles.segmentTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              }
            >
              <MiniBarChart data={stats.series} />

              <View style={styles.statTiles}>
                <StatTile
                  label="Ticket promedio"
                  value={formatCurrency(stats.avgOrder)}
                />
                <StatTile label="Día pico" value={stats.peakLabel} />
                <StatTile
                  label="Cancelaciones"
                  value={formatPercent(stats.cancelRate)}
                />
                <StatTile
                  label="En cocina"
                  value={String(stats.preparing)}
                />
              </View>
            </SectionCard>
          </View>

          <View style={wide ? styles.colSide : undefined}>
            <SectionCard
              title="Actividad reciente"
              subtitle="Últimos movimientos"
            >
              {activity.length === 0 ? (
                <Text style={styles.empty}>
                  Aún no hay actividad. Cuando lleguen pedidos, aparecerán aquí.
                </Text>
              ) : (
                activity.map((order) => {
                  const a = activityMeta(order.status);
                  return (
                    <View key={order.id} style={styles.activityRow}>
                      <View
                        style={[styles.activityIcon, { backgroundColor: a.bg }]}
                      >
                        <Feather name={a.icon} size={15} color={a.fg} />
                      </View>
                      <View style={styles.activityText}>
                        <Text style={styles.activityTitle}>
                          {a.title} #{order.id.slice(0, 6).toUpperCase()}
                        </Text>
                        <Text style={styles.activityMeta}>
                          {order.items.length} artículos ·{' '}
                          {formatCurrency(order.total)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </SectionCard>
          </View>
        </View>

        <SectionCard
          title="Pedidos recientes"
          subtitle={`${products.length} platillos en tu menú`}
          flush
        >
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colId]}>PEDIDO</Text>
            <Text style={[styles.th, styles.colCustomer]}>CLIENTE</Text>
            <Text style={[styles.th, styles.colItems]}>ARTÍCULOS</Text>
            <Text style={[styles.th, styles.colTotal]}>TOTAL</Text>
            <Text style={[styles.th, styles.colStatus]}>ESTADO</Text>
          </View>
          {recent.length === 0 ? (
            <Text style={styles.emptyRow}>
              Aún no hay pedidos. Cuando los clientes ordenen, aparecerán aquí.
            </Text>
          ) : (
            recent.map((order) => (
              <View key={order.id} style={styles.tableRow}>
                <Text style={[styles.td, styles.colId, styles.tdStrong]}>
                  #{order.id.slice(0, 6).toUpperCase()}
                </Text>
                <Text style={[styles.td, styles.colCustomer]} numberOfLines={1}>
                  {order.customerName ??
                    `Cliente ${order.customerId.slice(0, 6)}`}
                </Text>
                <Text style={[styles.td, styles.colItems]}>
                  {order.items.length}
                </Text>
                <Text style={[styles.td, styles.colTotal, styles.tdStrong]}>
                  {formatCurrency(order.total)}
                </Text>
                <View style={styles.colStatus}>
                  <StatusBadge status={order.status} />
                </View>
              </View>
            ))
          )}
        </SectionCard>
      </ScrollView>
    </ScreenShell>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statTileValue}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

type ActivityMeta = {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  bg: string;
  fg: string;
};

function activityMeta(status: string): ActivityMeta {
  switch (status) {
    case ORDER_STATUS.PENDING:
      return { icon: 'shopping-bag', title: 'Nuevo pedido', bg: colors.primarySoft, fg: colors.primary };
    case ORDER_STATUS.DELIVERED:
      return { icon: 'check-circle', title: 'Entregado', bg: colors.successSoft, fg: colors.success };
    case ORDER_STATUS.ON_THE_WAY:
      return { icon: 'truck', title: 'En camino', bg: colors.infoSoft, fg: colors.info };
    case ORDER_STATUS.CANCELLED:
    case ORDER_STATUS.REJECTED:
      return { icon: 'x-circle', title: 'Cancelado', bg: colors.dangerSoft, fg: colors.danger };
    default:
      return { icon: 'clock', title: 'En proceso', bg: colors.warningSoft, fg: colors.warning };
  }
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  pageHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  pageHeadText: { flex: 1, minWidth: 220 },
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  rangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rangePillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  columns: { gap: spacing.md },
  columnsRow: { flexDirection: 'row', alignItems: 'stretch' },
  colMain: { flex: 2 },
  colSide: { flex: 1, minWidth: 280 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    padding: 3,
  },
  segmentBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    ...({
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 1,
    } as object),
  },
  segmentText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  segmentTextActive: { color: colors.text },
  statTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statTile: {
    flex: 1,
    minWidth: 110,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statTileValue: { ...typography.h3, color: colors.text, fontWeight: '800' },
  statTileLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: { flex: 1 },
  activityTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  activityMeta: { ...typography.caption, color: colors.textSecondary },
  empty: { ...typography.bodySmall, color: colors.textSecondary },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  th: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  td: { ...typography.bodySmall, color: colors.textSecondary },
  tdStrong: { color: colors.text, fontWeight: '700' },
  colId: { width: 90 },
  colCustomer: { flex: 1, minWidth: 100 },
  colItems: { width: 90, textAlign: 'center' },
  colTotal: { width: 90 },
  colStatus: { width: 110, alignItems: 'flex-start' },
  emptyRow: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    padding: spacing.lg,
  },
});
