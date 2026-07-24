/**
 * screens/dashboard/AnalyticsScreen.tsx
 * Analíticas profundas — KPIs con tendencia, rendimiento de ingresos,
 * más vendidos, mapa de calor de horas pico, segmentos de clientes y
 * pedidos de mayor volumen. Todo derivado de pedidos y productos reales.
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
import { SectionCard } from '../../components/SectionCard';
import { MetricCard } from '../../components/MetricCard';
import { MiniBarChart, type BarPoint } from '../../components/MiniBarChart';
import { HeatMap } from '../../components/HeatMap';
import { StatusBadge } from '../../components/StatusBadge';
import { ProductImage } from '../../components/ProductImage';
import { Button } from '../../components/Button';
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
import { downloadCsv, fileDateStamp } from '../../utils/exportCsv';

type Period = 7 | 30 | 90;

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

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Índice de día con la semana empezando en lunes (0 = Lun … 6 = Dom). */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function hourLabel(h: number): string {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => hourLabel(h));

export function AnalyticsScreen() {
  const { orders, loading, refresh } = useOrders();
  const { products } = useProducts();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;

  const [period, setPeriod] = useState<Period>(30);

  const data = useMemo(() => {
    const now = new Date();
    const inRange = (o: Order, from: number, to: number): boolean => {
      const d = toDateSafe(o.createdAt);
      if (!d) return false;
      const ago = daysAgo(d, now);
      return ago >= from && ago <= to;
    };

    const current = orders.filter((o) => inRange(o, 0, period - 1));
    const previous = orders.filter((o) => inRange(o, period, period * 2 - 1));

    const deliveredOf = (list: Order[]) =>
      list.filter((o) => o.status === ORDER_STATUS.DELIVERED);
    const revenueOf = (list: Order[]) =>
      deliveredOf(list).reduce((s, o) => s + o.total, 0);

    const deliveredCur = deliveredOf(current);
    const revenue = revenueOf(current);
    const revenuePrev = revenueOf(previous);
    const avg = deliveredCur.length > 0 ? revenue / deliveredCur.length : 0;
    const deliveredPrev = deliveredOf(previous);
    const avgPrev =
      deliveredPrev.length > 0 ? revenuePrev / deliveredPrev.length : 0;
    const efficiency =
      current.length > 0 ? (deliveredCur.length / current.length) * 100 : 100;

    // Serie de ingresos: diaria hasta 30 días, semanal para periodos largos.
    let series: BarPoint[];
    let labelInterval: number;
    if (period <= 30) {
      series = Array.from({ length: period }, (_, i) => {
        const ago = period - 1 - i;
        const day = new Date(now);
        day.setDate(now.getDate() - ago);
        const value = deliveredCur
          .filter((o) => {
            const od = toDateSafe(o.createdAt);
            return od != null && daysAgo(od, now) === ago;
          })
          .reduce((s, o) => s + o.total, 0);
        return { label: `${day.getDate()}/${day.getMonth() + 1}`, value };
      });
      labelInterval = period <= 7 ? 1 : 7;
    } else {
      const weeks = Math.ceil(period / 7);
      series = Array.from({ length: weeks }, (_, i) => {
        const weekFromEnd = weeks - 1 - i;
        const from = weekFromEnd * 7;
        const to = from + 6;
        const day = new Date(now);
        day.setDate(now.getDate() - to);
        const value = deliveredCur
          .filter((o) => {
            const od = toDateSafe(o.createdAt);
            if (!od) return false;
            const ago = daysAgo(od, now);
            return ago >= from && ago <= to;
          })
          .reduce((s, o) => s + o.total, 0);
        return { label: `${day.getDate()}/${day.getMonth() + 1}`, value };
      });
      labelInterval = 3;
    }

    // Más vendidos por ingresos.
    const sales: Record<
      string,
      { name: string; qty: number; revenue: number; image?: string }
    > = {};
    current.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productId || item.name;
        if (!sales[key]) {
          sales[key] = {
            name: item.name,
            qty: 0,
            revenue: 0,
            image: products.find((p) => p.id === item.productId)?.imageURL,
          };
        }
        sales[key].qty += item.qty;
        sales[key].revenue += item.subtotal || item.price * item.qty;
      });
    });
    const bestSellers = Object.values(sales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    // Mapa de calor día × hora.
    const matrix: number[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => 0)
    );
    let peak = { day: -1, hour: -1, count: 0 };
    current.forEach((o) => {
      const d = toDateSafe(o.createdAt);
      if (!d) return;
      const r = mondayIndex(d);
      const c = d.getHours();
      matrix[r][c] += 1;
      if (matrix[r][c] > peak.count) {
        peak = { day: r, hour: c, count: matrix[r][c] };
      }
    });

    // Segmentos de clientes.
    const perCustomer = new Map<string, number>();
    current.forEach((o) => {
      const id = o.customerId || 'desconocido';
      perCustomer.set(id, (perCustomer.get(id) ?? 0) + 1);
    });
    const totalCustomers = perCustomer.size;
    const returning = Array.from(perCustomer.values()).filter(
      (n) => n > 1
    ).length;
    const returningPct =
      totalCustomers > 0 ? (returning / totalCustomers) * 100 : 0;
    const onlinePayments = current.filter(
      (o) => o.paymentMethod !== 'cash'
    ).length;
    const onlinePct =
      current.length > 0 ? (onlinePayments / current.length) * 100 : 0;

    const topOrders = [...current].sort((a, b) => b.total - a.total).slice(0, 5);

    return {
      revenue,
      totalOrders: current.length,
      avg,
      efficiency,
      revenueTrend: computeDelta(revenue, revenuePrev),
      ordersTrend: computeDelta(current.length, previous.length),
      avgTrend: computeDelta(avg, avgPrev),
      series,
      labelInterval,
      bestSellers,
      matrix,
      peak,
      returningPct,
      onlinePct,
      topOrders,
    };
  }, [orders, products, period]);

  const insight =
    data.peak.count > 0
      ? `El pico de pedidos es ${DAY_LABELS[data.peak.day]} alrededor de las ${hourLabel(data.peak.hour)} (${data.peak.count} pedidos). Considera reforzar cocina y reparto en esa franja.`
      : 'Aún no hay suficientes pedidos para detectar un patrón de horas pico. Vuelve a revisar cuando tengas más actividad.';

  /** Exporta el reporte del periodo: KPIs, serie de ingresos y más vendidos. */
  const exportReport = () => {
    const rows: Array<Array<string | number>> = [
      ['Reporte QuickBite', `Últimos ${period} días`],
      [],
      ['Indicador', 'Valor'],
      ['Ingresos totales', data.revenue.toFixed(2)],
      ['Pedidos totales', data.totalOrders],
      ['Ticket promedio', data.avg.toFixed(2)],
      ['Eficiencia (%)', data.efficiency.toFixed(0)],
      ['Clientes recurrentes (%)', data.returningPct.toFixed(1)],
      ['Pago en línea (%)', data.onlinePct.toFixed(1)],
      [],
      ['Ingresos por periodo', ''],
      ['Fecha', 'Ingresos'],
      ...data.series.map((p) => [p.label, p.value.toFixed(2)]),
      [],
      ['Más vendidos', ''],
      ['Platillo', 'Unidades', 'Ingresos'],
      ...data.bestSellers.map((b) => [b.name, b.qty, b.revenue.toFixed(2)]),
    ];
    downloadCsv(`analiticas-${period}d-${fileDateStamp()}`, rows);
  };

  const periods: [Period, string][] = [
    [7, '7 días'],
    [30, '30 días'],
    [90, '90 días'],
  ];

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <View style={styles.pageHead}>
          <View style={styles.pageHeadText}>
            <Text style={styles.title}>Analíticas</Text>
            <Text style={styles.subtitle}>
              Información integral del crecimiento de tu restaurante
            </Text>
          </View>
          <View style={styles.headActions}>
            <View style={styles.segment}>
              {periods.map(([key, label]) => (
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
            <Button
              title="Exportar"
              variant="outline"
              onPress={exportReport}
            />
          </View>
        </View>

        <View style={styles.grid}>
          <MetricCard
            label="Ingresos totales"
            value={formatCurrency(data.revenue)}
            icon="dollar-sign"
            tone="success"
            trend={data.revenueTrend}
            trendPosition="top"
          />
          <MetricCard
            label="Pedidos totales"
            value={formatNumber(data.totalOrders)}
            icon="shopping-bag"
            tone="primary"
            trend={data.ordersTrend}
            trendPosition="top"
          />
          <MetricCard
            label="Ticket promedio"
            value={formatCurrency(data.avg)}
            icon="credit-card"
            tone="info"
            trend={data.avgTrend}
            trendPosition="top"
          />
          <MetricCard
            label="Eficiencia"
            value={formatPercent(data.efficiency, 0)}
            icon="zap"
            tone="success"
            badge={data.efficiency >= 90 ? 'Optimizado' : undefined}
            badgeTone="up"
            hint="Entregados / total"
          />
        </View>

        <View style={[styles.columns, wide && styles.columnsRow]}>
          <View style={wide ? styles.colMain : undefined}>
            <SectionCard
              title="Rendimiento de ingresos"
              subtitle={
                period <= 30
                  ? 'Ingresos por día del periodo'
                  : 'Ingresos por semana del periodo'
              }
            >
              <MiniBarChart
                data={data.series}
                height={200}
                showValues={false}
                labelInterval={data.labelInterval}
                valueFormatter={formatCurrencyCompact}
              />
            </SectionCard>
          </View>

          <View style={wide ? styles.colSide : undefined}>
            <SectionCard
              title="Más vendidos"
              subtitle="Por ingresos en el periodo"
            >
              {data.bestSellers.length === 0 ? (
                <Text style={styles.empty}>
                  Aún no hay ventas en este periodo.
                </Text>
              ) : (
                data.bestSellers.map((item, idx) => (
                  <View key={`${item.name}-${idx}`} style={styles.sellerRow}>
                    <View style={styles.sellerThumb}>
                      <ProductImage uri={item.image} style={styles.thumbImg} />
                    </View>
                    <View style={styles.sellerText}>
                      <Text style={styles.sellerName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.sellerMeta}>
                        {formatNumber(item.qty)} vendidos
                      </Text>
                    </View>
                    <View style={styles.sellerRight}>
                      <Text style={styles.sellerRevenue}>
                        {formatCurrencyCompact(item.revenue)}
                      </Text>
                      {idx === 0 ? (
                        <View style={styles.topBadge}>
                          <Text style={styles.topBadgeText}>TOP</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </SectionCard>
          </View>
        </View>

        <View style={[styles.columns, wide && styles.columnsRow]}>
          <View style={wide ? styles.colMain : undefined}>
            <SectionCard
              title="Volumen de pedidos por hora"
              subtitle="Concentración por día de la semana y franja horaria"
            >
              <HeatMap
                matrix={data.matrix}
                rowLabels={DAY_LABELS}
                columnLabels={HOUR_LABELS}
                columnLabelInterval={4}
              />
            </SectionCard>
          </View>

          <View style={wide ? styles.colSide : undefined}>
            <SectionCard
              title="Segmentos de clientes"
              subtitle="Comportamiento en el periodo"
            >
              <SegmentBar
                label="Clientes recurrentes"
                value={data.returningPct}
                color={colors.primary}
              />
              <SegmentBar
                label="Pago en línea"
                value={data.onlinePct}
                color={colors.info}
                caption={`${formatPercent(100 - data.onlinePct, 0)} en efectivo`}
              />

              <View style={styles.insight}>
                <View style={styles.insightHead}>
                  <Feather name="zap" size={14} color={colors.info} />
                  <Text style={styles.insightTitle}>Hallazgo</Text>
                </View>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            </SectionCard>
          </View>
        </View>

        <SectionCard
          title="Pedidos de mayor volumen"
          subtitle={`Top ${data.topOrders.length} del periodo`}
          flush
        >
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colId]}>PEDIDO</Text>
            <Text style={[styles.th, styles.colCustomer]}>CLIENTE</Text>
            <Text style={[styles.th, styles.colItems]}>ARTÍCULOS</Text>
            <Text style={[styles.th, styles.colTotal]}>MONTO</Text>
            <Text style={[styles.th, styles.colStatus]}>ESTADO</Text>
            <Text style={[styles.th, styles.colTime]}>CUÁNDO</Text>
          </View>
          {data.topOrders.length === 0 ? (
            <Text style={styles.emptyRow}>
              Aún no hay pedidos en este periodo.
            </Text>
          ) : (
            data.topOrders.map((order) => (
              <View key={order.id} style={styles.tableRow}>
                <Text style={[styles.td, styles.colId, styles.tdStrong]}>
                  #{order.id.slice(0, 6).toUpperCase()}
                </Text>
                <Text style={[styles.td, styles.colCustomer]} numberOfLines={1}>
                  {order.customerName ??
                    `Cliente ${order.customerId.slice(0, 6)}`}
                </Text>
                <Text style={[styles.td, styles.colItems]} numberOfLines={1}>
                  {order.items
                    .slice(0, 2)
                    .map((i) => `${i.qty}x ${i.name}`)
                    .join(', ')}
                  {order.items.length > 2 ? ` +${order.items.length - 2}` : ''}
                </Text>
                <Text style={[styles.td, styles.colTotal, styles.tdStrong]}>
                  {formatCurrency(order.total)}
                </Text>
                <View style={styles.colStatus}>
                  <StatusBadge status={order.status} />
                </View>
                <Text style={[styles.td, styles.colTime]} numberOfLines={1}>
                  {relTime(order.createdAt)}
                </Text>
              </View>
            ))
          )}
        </SectionCard>
      </ScrollView>
    </ScreenShell>
  );
}

function SegmentBar({
  label,
  value,
  color,
  caption,
}: {
  label: string;
  value: number;
  color: string;
  caption?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.segmentBlock}>
      <View style={styles.segmentLabels}>
        <Text style={styles.segmentLabel}>{label}</Text>
        <Text style={[styles.segmentValue, { color }]}>
          {formatPercent(pct, 0)}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]}
        />
      </View>
      {caption ? <Text style={styles.segmentCaption}>{caption}</Text> : null}
    </View>
  );
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
  headActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
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
  segmentBtnActive: { backgroundColor: colors.surface },
  segmentText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  segmentTextActive: { color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  columns: { gap: spacing.md },
  columnsRow: { flexDirection: 'row', alignItems: 'stretch' },
  colMain: { flex: 2 },
  colSide: { flex: 1, minWidth: 280 },
  empty: { ...typography.bodySmall, color: colors.textSecondary },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  sellerThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  thumbImg: { width: '100%', height: '100%' },
  sellerText: { flex: 1 },
  sellerName: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
  },
  sellerMeta: { ...typography.caption, color: colors.textSecondary },
  sellerRight: { alignItems: 'flex-end', gap: 2 },
  sellerRevenue: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '800',
  },
  topBadge: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  topBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 0.5,
  },
  segmentBlock: { marginBottom: spacing.md },
  segmentLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: spacing.sm,
  },
  segmentLabel: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  segmentValue: { ...typography.bodySmall, fontWeight: '800' },
  track: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.full },
  segmentCaption: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  insight: {
    backgroundColor: colors.infoSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  insightHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  insightTitle: {
    ...typography.bodySmall,
    color: colors.info,
    fontWeight: '800',
  },
  insightText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 17,
  },
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
  th: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
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
  colItems: { flex: 1.4, minWidth: 120 },
  colTotal: { width: 100 },
  colStatus: { width: 110, alignItems: 'flex-start' },
  colTime: { width: 100 },
  emptyRow: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    padding: spacing.lg,
  },
});
