/**
 * screens/dashboard/LiquidacionesScreen.tsx
 * Liquidaciones — dinero cobrado con tarjeta (Openpay) que la plataforma retiene
 * y transfiere al restaurante. Muestra bruto cobrado, comisión de la plataforma,
 * neto pendiente por liquidar y ya liquidado, con desglose por pedido, acción
 * para marcar pedidos como liquidados y exportación CSV.
 *
 * Los pedidos en efectivo NO aparecen aquí (el restaurante los cobra directo).
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { SectionCard } from '../../components/SectionCard';
import { MetricCard } from '../../components/MetricCard';
import { Button } from '../../components/Button';
import { useOrders } from '../../hooks/useOrders';
import { markOrdersSettled, unmarkOrdersSettled } from '../../services/orderService';
import { ORDER_STATUS, PLATFORM_COMMISSION_RATE } from '../../utils/constants';
import type { Order } from '../../types/order';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/format';
import { downloadCsv, fileDateStamp } from '../../utils/exportCsv';
import { confirmAction } from '../../utils/confirm';
import { notifySuccess, notifyError } from '../../utils/notify';

type Period = 7 | 30 | 90;
type RowFilter = 'pending' | 'settled' | 'all';

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

function shortDate(v: unknown): string {
  const d = toDateSafe(v);
  if (!d) return '—';
  return `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
}

function cardLabel(o: Order): string {
  if (!o.cardLast4) return 'Tarjeta';
  const brand = o.cardBrand
    ? o.cardBrand.charAt(0).toUpperCase() + o.cardBrand.slice(1)
    : 'Tarjeta';
  return `${brand} ···· ${o.cardLast4}`;
}

const isSettled = (o: Order) => Boolean(o.settledAt);

export function LiquidacionesScreen() {
  const { orders, loading, refresh } = useOrders();
  const [period, setPeriod] = useState<Period>(30);
  const [rowFilter, setRowFilter] = useState<RowFilter>('pending');
  const [saving, setSaving] = useState(false);
  const [ratePct, setRatePct] = useState(
    String(Math.round(PLATFORM_COMMISSION_RATE * 100))
  );

  const rate = Math.max(0, Math.min(100, Number(ratePct) || 0)) / 100;

  const data = useMemo(() => {
    const now = new Date();

    // Cobrado con tarjeta vía Openpay, pagado, dentro del periodo y no
    // rechazado/cancelado (esos se reembolsan, no se liquidan).
    const inPeriod = orders.filter((o) => {
      if (o.paymentProvider !== 'openpay' || o.paymentStatus !== 'paid') {
        return false;
      }
      if (
        o.status === ORDER_STATUS.REJECTED ||
        o.status === ORDER_STATUS.CANCELLED
      ) {
        return false;
      }
      const d = toDateSafe(o.paidAt ?? o.createdAt);
      if (!d) return false;
      const ago = daysAgo(d, now);
      return ago >= 0 && ago <= period - 1;
    });

    const byDate = (a: Order, b: Order) =>
      (toDateSafe(b.paidAt ?? b.createdAt)?.getTime() ?? 0) -
      (toDateSafe(a.paidAt ?? a.createdAt)?.getTime() ?? 0);

    const pending = inPeriod.filter((o) => !isSettled(o)).sort(byDate);
    const settled = inPeriod.filter(isSettled).sort(byDate);

    const grossOf = (list: Order[]) => list.reduce((s, o) => s + o.total, 0);
    const gross = grossOf(inPeriod);

    return {
      pending,
      settled,
      gross,
      commission: gross * rate,
      pendingNet: grossOf(pending) * (1 - rate),
      settledNet: grossOf(settled) * (1 - rate),
      count: inPeriod.length,
    };
  }, [orders, period, rate]);

  const rows =
    rowFilter === 'pending'
      ? data.pending
      : rowFilter === 'settled'
        ? data.settled
        : [...data.pending, ...data.settled];

  const settleOrders = async (ids: string[], label: string) => {
    if (ids.length === 0 || saving) return;
    const ok = await confirmAction(
      'Marcar como liquidado',
      `Confirma que ya transferiste ${label} al restaurante. Se marcarán ${ids.length} ${ids.length === 1 ? 'pedido' : 'pedidos'} como liquidados.`,
      { confirmText: 'Sí, marcar' }
    );
    if (!ok) return;
    setSaving(true);
    try {
      await markOrdersSettled(ids);
      await refresh();
      notifySuccess(
        `${ids.length} ${ids.length === 1 ? 'pedido liquidado' : 'pedidos liquidados'}.`,
        'Liquidación registrada'
      );
    } catch {
      notifyError('No se pudo marcar la liquidación. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const unsettleOrder = async (id: string) => {
    if (saving) return;
    const ok = await confirmAction(
      'Deshacer liquidación',
      'El pedido volverá a "Pendiente por liquidar".',
      { confirmText: 'Sí, deshacer' }
    );
    if (!ok) return;
    setSaving(true);
    try {
      await unmarkOrdersSettled([id]);
      await refresh();
      notifySuccess('Liquidación deshecha.');
    } catch {
      notifyError('No se pudo deshacer. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const exportReport = () => {
    const ratePctLabel = `${(rate * 100).toFixed(1)}%`;
    const all = [...data.pending, ...data.settled];
    const csv: Array<Array<string | number>> = [
      ['Liquidaciones QuickBite', `Últimos ${period} días`],
      ['Comisión de plataforma', ratePctLabel],
      [],
      ['Resumen', ''],
      ['Cobrado con tarjeta', data.gross.toFixed(2)],
      ['Comisión plataforma', data.commission.toFixed(2)],
      ['Pendiente por liquidar (neto)', data.pendingNet.toFixed(2)],
      ['Ya liquidado (neto)', data.settledNet.toFixed(2)],
      ['Pedidos pagados', data.count],
      [],
      ['Detalle por pedido', ''],
      ['Fecha', 'Pedido', 'Cliente', 'Tarjeta', 'Cargo Openpay', 'Cobrado', 'Comisión', 'Neto', 'Estado'],
      ...all.map((o) => [
        shortDate(o.paidAt ?? o.createdAt),
        `#${o.id.slice(0, 8).toUpperCase()}`,
        o.customerName ?? `Cliente ${o.customerId.slice(0, 6)}`,
        cardLabel(o),
        o.openpayChargeId ?? '—',
        o.total.toFixed(2),
        (o.total * rate).toFixed(2),
        (o.total * (1 - rate)).toFixed(2),
        isSettled(o) ? 'Liquidado' : 'Pendiente',
      ]),
    ];
    downloadCsv(`liquidaciones-${period}d-${fileDateStamp()}`, csv);
  };

  const periods: [Period, string][] = [
    [7, '7 días'],
    [30, '30 días'],
    [90, '90 días'],
  ];
  const filters: [RowFilter, string][] = [
    ['pending', `Pendientes (${data.pending.length})`],
    ['settled', `Liquidados (${data.settled.length})`],
    ['all', 'Todos'],
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
            <Text style={styles.title}>Liquidaciones</Text>
            <Text style={styles.subtitle}>
              Dinero cobrado con tarjeta que la plataforma te transfiere
            </Text>
          </View>
          <View style={styles.headActions}>
            <View style={styles.commissionBox}>
              <Text style={styles.commissionLabel}>Comisión</Text>
              <TextInput
                value={ratePct}
                onChangeText={(v) => setRatePct(v.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                style={styles.commissionInput}
                maxLength={5}
              />
              <Text style={styles.commissionPct}>%</Text>
            </View>
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
            <Button title="Exportar" variant="outline" onPress={exportReport} />
          </View>
        </View>

        <View style={styles.grid}>
          <MetricCard
            label="Cobrado con tarjeta"
            value={formatCurrency(data.gross)}
            icon="credit-card"
            tone="info"
            hint={`${data.count} ${data.count === 1 ? 'pedido' : 'pedidos'}`}
          />
          <MetricCard
            label="Comisión plataforma"
            value={formatCurrency(data.commission)}
            icon="percent"
            tone="warning"
            hint={formatPercent(rate * 100, (rate * 100) % 1 === 0 ? 0 : 1)}
          />
          <MetricCard
            label="Pendiente por liquidar"
            value={formatCurrency(data.pendingNet)}
            icon="clock"
            tone="primary"
            hint={`${data.pending.length} ${data.pending.length === 1 ? 'pedido' : 'pedidos'}`}
          />
          <MetricCard
            label="Ya liquidado"
            value={formatCurrency(data.settledNet)}
            icon="check-circle"
            tone="success"
            hint={`${data.settled.length} ${data.settled.length === 1 ? 'pedido' : 'pedidos'}`}
          />
        </View>

        <View style={styles.note}>
          <Feather name="info" size={14} color={colors.info} />
          <Text style={styles.noteText}>
            La plataforma retiene estos pagos con tarjeta y te transfiere el neto.
            Marca los pedidos como liquidados cuando ya hayas hecho la
            transferencia. Los pedidos en efectivo no aparecen aquí.
          </Text>
        </View>

        <SectionCard
          title="Detalle de pagos con tarjeta"
          subtitle={`${data.count} ${data.count === 1 ? 'pedido pagado' : 'pedidos pagados'} en el periodo`}
          flush
        >
          <View style={styles.toolbar}>
            <View style={styles.segment}>
              {filters.map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.segmentBtn,
                    rowFilter === key && styles.segmentBtnActive,
                  ]}
                  onPress={() => setRowFilter(key)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      rowFilter === key && styles.segmentTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              title={
                data.pending.length > 0
                  ? `Marcar liquidado (${data.pending.length})`
                  : 'Todo liquidado'
              }
              onPress={() =>
                settleOrders(
                  data.pending.map((o) => o.id),
                  formatCurrency(data.pendingNet)
                )
              }
              loading={saving}
              disabled={data.pending.length === 0}
            />
          </View>

          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colDate]}>FECHA</Text>
            <Text style={[styles.th, styles.colId]}>PEDIDO</Text>
            <Text style={[styles.th, styles.colCustomer]}>CLIENTE</Text>
            <Text style={[styles.th, styles.colCard]}>TARJETA</Text>
            <Text style={[styles.th, styles.colMoney]}>COBRADO</Text>
            <Text style={[styles.th, styles.colMoney]}>NETO</Text>
            <Text style={[styles.th, styles.colState]}>ESTADO</Text>
          </View>
          {rows.length === 0 ? (
            <Text style={styles.emptyRow}>
              {rowFilter === 'settled'
                ? 'Aún no hay pedidos liquidados en este periodo.'
                : 'No hay pagos con tarjeta pendientes en este periodo.'}
            </Text>
          ) : (
            rows.map((o) => {
              const done = isSettled(o);
              return (
                <View key={o.id} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colDate]}>
                    {shortDate(o.paidAt ?? o.createdAt)}
                  </Text>
                  <Text style={[styles.td, styles.colId, styles.tdStrong]}>
                    #{o.id.slice(0, 6).toUpperCase()}
                  </Text>
                  <Text
                    style={[styles.td, styles.colCustomer]}
                    numberOfLines={1}
                  >
                    {o.customerName ?? `Cliente ${o.customerId.slice(0, 6)}`}
                  </Text>
                  <Text style={[styles.td, styles.colCard]} numberOfLines={1}>
                    {cardLabel(o)}
                  </Text>
                  <Text style={[styles.td, styles.colMoney, styles.tdStrong]}>
                    {formatCurrency(o.total)}
                  </Text>
                  <Text style={[styles.td, styles.colMoney, styles.tdNet]}>
                    {formatCurrency(o.total * (1 - rate))}
                  </Text>
                  <View style={styles.colState}>
                    {done ? (
                      <TouchableOpacity
                        style={[styles.badge, styles.badgeDone]}
                        onPress={() => unsettleOrder(o.id)}
                        disabled={saving}
                        accessibilityLabel="Deshacer liquidación"
                      >
                        <Feather name="check" size={11} color={colors.success} />
                        <Text style={[styles.badgeText, { color: colors.success }]}>
                          Liquidado
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.badge, styles.badgePending]}
                        onPress={() =>
                          settleOrders([o.id], formatCurrency(o.total * (1 - rate)))
                        }
                        disabled={saving}
                      >
                        <Text style={[styles.badgeText, { color: colors.primary }]}>
                          Marcar
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </SectionCard>
      </ScrollView>
    </ScreenShell>
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
  commissionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  commissionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  commissionInput: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '800',
    minWidth: 28,
    textAlign: 'right',
    paddingVertical: 0,
  },
  commissionPct: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
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
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 17,
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
    flexWrap: 'wrap',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
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
  tdNet: { color: colors.success, fontWeight: '800' },
  colDate: { width: 80 },
  colId: { width: 90 },
  colCustomer: { flex: 1, minWidth: 100 },
  colCard: { width: 130 },
  colMoney: { width: 100, textAlign: 'right' },
  colState: { width: 110, alignItems: 'flex-end' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeDone: { backgroundColor: colors.successSoft },
  badgePending: { backgroundColor: colors.primarySoft },
  badgeText: { ...typography.caption, fontWeight: '800', fontSize: 11 },
  emptyRow: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    padding: spacing.lg,
  },
});
