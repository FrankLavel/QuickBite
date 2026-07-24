/**
 * screens/dashboard/CustomersScreen.tsx
 * CRM de clientes derivado de los pedidos (no hay colección de clientes):
 * panorama de lealtad, segmentación, tabla paginada y señales de retención.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ComponentProps } from 'react';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { SectionCard } from '../../components/SectionCard';
import { UserAvatar } from '../../components/UserAvatar';
import { MiniBarChart, type BarPoint } from '../../components/MiniBarChart';
import { useOrders } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';
import type { MainStackParamList } from '../../types/navigation';
import { colors, radius, shadows, spacing, typography } from '../../utils/theme';
import {
  computeDelta,
  formatCurrency,
  formatNumber,
  formatPercent,
  type MetricDelta,
} from '../../utils/format';
import { downloadCsv, fileDateStamp } from '../../utils/exportCsv';

type FeatherIconName = ComponentProps<typeof Feather>['name'];
type Filter = 'all' | 'new' | 'frequent' | 'risk';
type Status = 'vip' | 'regular' | 'new' | 'risk';

const PAGE_SIZE = 10;
/** Días sin pedir a partir de los cuales un cliente se considera en riesgo. */
const RISK_DAYS = 14;
/** Pedidos mínimos para considerar a un cliente frecuente / VIP. */
const VIP_ORDERS = 5;

interface CustomerRow {
  id: string;
  name: string;
  phone?: string;
  orders: number;
  lifetimeValue: number;
  lastOrder: Date | null;
  firstOrder: Date | null;
  status: Status;
}

const STATUS_META: Record<Status, { label: string; bg: string; fg: string }> = {
  vip: { label: 'VIP', bg: colors.successSoft, fg: colors.success },
  regular: { label: 'Regular', bg: colors.infoSoft, fg: colors.info },
  new: { label: 'Nuevo', bg: colors.primarySoft, fg: colors.primary },
  risk: { label: 'En riesgo', bg: colors.warningSoft, fg: colors.warning },
};

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

function lastOrderLabel(d: Date | null, now: Date): string {
  if (!d) return 'Sin pedidos';
  const diff = daysAgo(d, now);
  if (diff === 0) {
    const h = Math.floor((now.getTime() - d.getTime()) / 3600000);
    if (h < 1) return 'Hace minutos';
    return `Hace ${h} h`;
  }
  if (diff === 1) return 'Ayer';
  if (diff < 7) return `Hace ${diff} días`;
  if (diff < 30) return `Hace ${Math.floor(diff / 7)} sem.`;
  return `Hace ${Math.floor(diff / 30)} mes(es)`;
}

export function CustomersScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { orders, loading, refresh } = useOrders();
  const { products } = useProducts();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;

  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const data = useMemo(() => {
    const now = new Date();

    // --- Agregado por cliente ---
    const map = new Map<string, CustomerRow>();
    orders.forEach((o) => {
      const id = o.customerId || 'desconocido';
      const date = toDateSafe(o.createdAt);
      const current =
        map.get(id) ??
        ({
          id,
          name: o.customerName ?? `Cliente ${id.slice(0, 6)}`,
          phone: o.customerPhone,
          orders: 0,
          lifetimeValue: 0,
          lastOrder: null,
          firstOrder: null,
          status: 'regular',
        } as CustomerRow);

      current.orders += 1;
      current.lifetimeValue += o.total;
      if (o.customerName) current.name = o.customerName;
      if (o.customerPhone) current.phone = o.customerPhone;
      if (date) {
        if (!current.lastOrder || date > current.lastOrder)
          current.lastOrder = date;
        if (!current.firstOrder || date < current.firstOrder)
          current.firstOrder = date;
      }
      map.set(id, current);
    });

    const customers = Array.from(map.values()).map((c) => {
      const daysSince = c.lastOrder ? daysAgo(c.lastOrder, now) : 9999;
      const isNew = c.firstOrder ? daysAgo(c.firstOrder, now) <= 30 : false;
      let status: Status = 'regular';
      if (daysSince > RISK_DAYS) status = 'risk';
      else if (c.orders >= VIP_ORDERS) status = 'vip';
      else if (isNew) status = 'new';
      return { ...c, status };
    });
    customers.sort((a, b) => b.lifetimeValue - a.lifetimeValue);

    // --- Concentración de ingresos (top 10%) ---
    const totalRevenue = customers.reduce((s, c) => s + c.lifetimeValue, 0);
    const topCount = Math.max(1, Math.ceil(customers.length * 0.1));
    const topRevenue = customers
      .slice(0, topCount)
      .reduce((s, c) => s + c.lifetimeValue, 0);
    const topShare = totalRevenue > 0 ? (topRevenue / totalRevenue) * 100 : 0;

    // --- KPIs y tendencias (30 días vs. 30 anteriores) ---
    const inRange = (from: number, to: number) =>
      orders.filter((o) => {
        const d = toDateSafe(o.createdAt);
        if (!d) return false;
        const ago = daysAgo(d, now);
        return ago >= from && ago <= to;
      });
    const cur = inRange(0, 29);
    const prev = inRange(30, 59);
    const distinct = (list: typeof orders) =>
      new Set(list.map((o) => o.customerId || 'desconocido')).size;
    const avgOf = (list: typeof orders) =>
      list.length > 0
        ? list.reduce((s, o) => s + o.total, 0) / list.length
        : 0;

    const avgOrderValue =
      orders.length > 0
        ? orders.reduce((s, o) => s + o.total, 0) / orders.length
        : 0;

    const activeToday = customers.filter(
      (c) => c.lastOrder && daysAgo(c.lastOrder, now) === 0
    ).length;
    const atRisk = customers.filter((c) => c.status === 'risk').length;

    // --- Pulso de retención: clientes activos por semana (8 semanas) ---
    const pulse: BarPoint[] = Array.from({ length: 8 }, (_, i) => {
      const weekFromEnd = 7 - i;
      const from = weekFromEnd * 7;
      const to = from + 6;
      const ids = new Set(
        orders
          .filter((o) => {
            const d = toDateSafe(o.createdAt);
            if (!d) return false;
            const ago = daysAgo(d, now);
            return ago >= from && ago <= to;
          })
          .map((o) => o.customerId || 'desconocido')
      );
      return { label: weekFromEnd === 0 ? 'Actual' : `-${weekFromEnd}`, value: ids.size };
    });
    const pulseDelta = computeDelta(
      pulse[pulse.length - 1]?.value ?? 0,
      pulse[pulse.length - 2]?.value ?? 0
    );

    // --- Etiquetas más pedidas (desde los tags de los productos) ---
    const tagCounts: Record<string, number> = {};
    orders.forEach((o) => {
      o.items.forEach((it) => {
        const p = products.find((pp) => pp.id === it.productId);
        p?.tags.forEach((t) => {
          tagCounts[t] = (tagCounts[t] ?? 0) + it.qty;
        });
      });
    });
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      customers,
      topShare,
      totalCustomers: customers.length,
      avgOrderValue,
      activeToday,
      atRisk,
      customersTrend: computeDelta(distinct(cur), distinct(prev)),
      avgTrend: computeDelta(avgOf(cur), avgOf(prev)),
      pulse,
      pulseDelta,
      topTags,
    };
  }, [orders, products]);

  const filtered = useMemo(() => {
    let list: CustomerRow[];
    switch (filter) {
      case 'new':
        list = data.customers.filter((c) => c.status === 'new');
        break;
      case 'frequent':
        list = data.customers.filter((c) => c.orders >= VIP_ORDERS);
        break;
      case 'risk':
        list = data.customers.filter((c) => c.status === 'risk');
        break;
      default:
        list = data.customers;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q)
    );
  }, [data.customers, filter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );
  const from = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const to = Math.min(filtered.length, (safePage + 1) * PAGE_SIZE);

  /** Genera el CSV de una lista de clientes. */
  const exportCustomers = (rowsIn: CustomerRow[], label: string) => {
    const now = new Date();
    const rows: Array<Array<string | number>> = [
      [
        'Cliente',
        'Teléfono',
        'Estado',
        'Pedidos',
        'Valor total',
        'Ticket promedio',
        'Primer pedido',
        'Último pedido',
      ],
      ...rowsIn.map((c) => [
        c.name,
        c.phone ?? '',
        STATUS_META[c.status].label,
        c.orders,
        c.lifetimeValue.toFixed(2),
        (c.orders > 0 ? c.lifetimeValue / c.orders : 0).toFixed(2),
        c.firstOrder ? c.firstOrder.toLocaleDateString('es-MX') : '',
        c.lastOrder ? c.lastOrder.toLocaleDateString('es-MX') : '',
      ]),
    ];
    downloadCsv(`${label}-${fileDateStamp(now)}`, rows);
  };

  const changeFilter = (f: Filter) => {
    setFilter(f);
    setPage(0);
    setOpenId(null);
  };

  const filters: [Filter, string][] = [
    ['all', 'Todos'],
    ['new', 'Nuevos'],
    ['frequent', 'Frecuentes'],
    ['risk', 'En riesgo'],
  ];

  const now = new Date();
  const maxTag = data.topTags[0]?.[1] ?? 1;

  return (
    <ScreenShell
      searchPlaceholder="Buscar clientes por nombre o teléfono..."
      onSearchChange={(t) => {
        setSearchQuery(t);
        setPage(0);
      }}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {/* Panorama + KPIs */}
        <View style={[styles.columns, wide && styles.columnsRow]}>
          <View style={wide ? styles.colMain : undefined}>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Panorama de lealtad</Text>
              <Text style={styles.heroText}>
                {data.totalCustomers > 0
                  ? `Tu 10% de clientes más valiosos genera el ${formatPercent(data.topShare, 0)} de tus ingresos. Contáctalos con ofertas personalizadas para aumentar la retención.`
                  : 'Aún no hay clientes registrados. Cuando recibas pedidos verás aquí quiénes son tus clientes más valiosos.'}
              </Text>
              <View style={styles.heroActions}>
                <TouchableOpacity
                  style={styles.heroBtnLight}
                  onPress={() =>
                    exportCustomers(data.customers, 'crm-clientes')
                  }
                >
                  <Text style={styles.heroBtnLightText}>Exportar CRM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.heroBtnSolid}
                  onPress={() => navigation.navigate('Promociones')}
                >
                  <Text style={styles.heroBtnSolidText}>Nueva campaña</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={wide ? styles.colSide : undefined}>
            <StatCard
              label="Total de clientes"
              value={formatNumber(data.totalCustomers)}
              icon="user-plus"
              tone={colors.primary}
              toneSoft={colors.primarySoft}
              delta={data.customersTrend}
              deltaLabel="este mes"
            />
            <StatCard
              label="Ticket promedio"
              value={formatCurrency(data.avgOrderValue)}
              icon="credit-card"
              tone={colors.info}
              toneSoft={colors.infoSoft}
              delta={data.avgTrend}
              deltaLabel="vs. mes anterior"
            />
          </View>
        </View>

        {/* Barra de filtros */}
        <View style={styles.filterBar}>
          <Text style={styles.filterLabel}>FILTRAR POR:</Text>
          <View style={styles.segment}>
            {filters.map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.segBtn, filter === key && styles.segBtnActive]}
                onPress={() => changeFilter(key)}
              >
                <Text
                  style={[
                    styles.segText,
                    filter === key && styles.segTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.csvBtn}
            onPress={() => exportCustomers(filtered, 'clientes')}
          >
            <Feather name="download" size={14} color={colors.textSecondary} />
            <Text style={styles.csvText}>Descargar CSV</Text>
          </TouchableOpacity>
        </View>

        {/* Tabla */}
        <SectionCard
          title={
            filter === 'risk'
              ? 'Clientes en riesgo'
              : filter === 'frequent'
                ? 'Clientes frecuentes'
                : filter === 'new'
                  ? 'Clientes nuevos'
                  : 'Todos los clientes'
          }
          action={
            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>
                {data.activeToday} activos hoy
              </Text>
            </View>
          }
          flush
        >
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colName]}>CLIENTE</Text>
            <Text style={[styles.th, styles.colStatus]}>ESTADO</Text>
            <Text style={[styles.th, styles.colOrders]}>PEDIDOS</Text>
            <Text style={[styles.th, styles.colValue]}>VALOR TOTAL</Text>
            <Text style={[styles.th, styles.colLast]}>ÚLTIMO PEDIDO</Text>
            <View style={styles.colActions} />
          </View>

          {pageRows.length === 0 ? (
            <Text style={styles.emptyRow}>
              No hay clientes en este segmento.
            </Text>
          ) : (
            pageRows.map((c) => {
              const meta = STATUS_META[c.status];
              const open = openId === c.id;
              return (
                <View key={c.id}>
                  <View style={styles.tableRow}>
                    <View style={[styles.colName, styles.nameCell]}>
                      <UserAvatar name={c.name} size={36} />
                      <View style={styles.nameText}>
                        <Text style={styles.name} numberOfLines={1}>
                          {c.name}
                        </Text>
                        <Text style={styles.sub} numberOfLines={1}>
                          {c.phone ?? `ID ${c.id.slice(0, 8)}`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.colStatus}>
                      <View
                        style={[styles.badge, { backgroundColor: meta.bg }]}
                      >
                        <Text style={[styles.badgeText, { color: meta.fg }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.td, styles.colOrders]}>
                      {formatNumber(c.orders)}
                    </Text>
                    <Text style={[styles.td, styles.colValue, styles.tdStrong]}>
                      {formatCurrency(c.lifetimeValue)}
                    </Text>
                    <Text style={[styles.td, styles.colLast]} numberOfLines={1}>
                      {lastOrderLabel(c.lastOrder, now)}
                    </Text>

                    <View style={styles.colActions}>
                      <Pressable
                        onPress={() => setOpenId(open ? null : c.id)}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.iconBtn,
                          pressed && styles.iconBtnPressed,
                        ]}
                        accessibilityLabel="Ver detalle del cliente"
                      >
                        <Feather
                          name={open ? 'chevron-up' : 'more-vertical'}
                          size={17}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {open ? (
                    <View style={styles.detail}>
                      <DetailItem
                        label="Ticket promedio"
                        value={formatCurrency(
                          c.orders > 0 ? c.lifetimeValue / c.orders : 0
                        )}
                      />
                      <DetailItem
                        label="Primer pedido"
                        value={
                          c.firstOrder
                            ? c.firstOrder.toLocaleDateString('es-MX')
                            : '—'
                        }
                      />
                      <DetailItem
                        label="Último pedido"
                        value={
                          c.lastOrder
                            ? c.lastOrder.toLocaleDateString('es-MX')
                            : '—'
                        }
                      />
                      <DetailItem label="Teléfono" value={c.phone ?? '—'} />
                    </View>
                  ) : null}
                </View>
              );
            })
          )}

          <View style={styles.tableFoot}>
            <Text style={styles.footText}>
              Mostrando {from}-{to} de {formatNumber(filtered.length)} clientes
            </Text>
            <View style={styles.pager}>
              <PagerBtn
                icon="chevron-left"
                disabled={safePage === 0}
                onPress={() => setPage((p) => Math.max(0, p - 1))}
              />
              <Text style={styles.pagerText}>
                {safePage + 1} / {totalPages}
              </Text>
              <PagerBtn
                icon="chevron-right"
                disabled={safePage >= totalPages - 1}
                onPress={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
              />
            </View>
          </View>
        </SectionCard>

        {/* Tarjetas inferiores */}
        <View style={[styles.columns, wide && styles.columnsRow]}>
          <View style={wide ? styles.third : undefined}>
            <SectionCard
              title="Pulso de retención"
              subtitle="Clientes activos por semana"
            >
              <MiniBarChart
                data={data.pulse}
                height={110}
                showValues={false}
                labelInterval={2}
              />
              <Text style={styles.pulseText}>
                {data.pulseDelta.direction === 'flat'
                  ? 'Los clientes activos se mantienen estables respecto a la semana anterior.'
                  : `Los clientes activos ${data.pulseDelta.direction === 'up' ? 'subieron' : 'bajaron'} ${formatPercent(data.pulseDelta.percent, 1)} respecto a la semana anterior.`}
              </Text>
            </SectionCard>
          </View>

          <View style={wide ? styles.third : undefined}>
            <SectionCard
              title="Etiquetas más pedidas"
              subtitle={
                data.topTags.length > 0
                  ? `La favorita es "${data.topTags[0][0]}"`
                  : 'Sin datos todavía'
              }
            >
              {data.topTags.length === 0 ? (
                <Text style={styles.empty}>
                  Agrega etiquetas a tus platillos para descubrir las
                  preferencias de tus clientes.
                </Text>
              ) : (
                data.topTags.map(([tag, count]) => (
                  <View key={tag} style={styles.tagBlock}>
                    <View style={styles.tagLabels}>
                      <Text style={styles.tagName}>{tag}</Text>
                      <Text style={styles.tagCount}>{formatNumber(count)}</Text>
                    </View>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${Math.max(4, (count / maxTag) * 100)}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))
              )}
            </SectionCard>
          </View>

          <View style={wide ? styles.third : undefined}>
            <View style={styles.crmCard}>
              <View style={styles.crmIcon}>
                <Feather name="zap" size={20} color={colors.info} />
              </View>
              <Text style={styles.crmTitle}>Oportunidad CRM</Text>
              <Text style={styles.crmText}>
                {data.atRisk > 0
                  ? `${data.atRisk} cliente(s) no han ordenado en más de ${RISK_DAYS} días. Revisa el segmento y lánzales una promoción de reactivación.`
                  : 'Ningún cliente lleva más de dos semanas sin ordenar. Tu retención está saludable.'}
              </Text>
              <TouchableOpacity
                style={styles.crmBtn}
                onPress={() =>
                  data.atRisk > 0
                    ? changeFilter('risk')
                    : navigation.navigate('Promociones')
                }
              >
                <Text style={styles.crmBtnText}>
                  {data.atRisk > 0 ? 'Ver segmento' : 'Crear promoción'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
  toneSoft,
  delta,
  deltaLabel,
}: {
  label: string;
  value: string;
  icon: FeatherIconName;
  tone: string;
  toneSoft: string;
  delta: MetricDelta;
  deltaLabel: string;
}) {
  const up = delta.direction === 'up';
  const flat = delta.direction === 'flat';
  const color = flat ? colors.textSecondary : up ? colors.success : colors.danger;
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      <View style={styles.statRow}>
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
        <View style={[styles.statIcon, { backgroundColor: toneSoft }]}>
          <Feather name={icon} size={18} color={tone} />
        </View>
      </View>
      <View style={styles.statTrend}>
        <Feather
          name={flat ? 'minus' : up ? 'trending-up' : 'trending-down'}
          size={13}
          color={color}
        />
        <Text style={[styles.statTrendText, { color }]}>
          {flat
            ? 'Sin cambios'
            : `${up ? '+' : '−'}${delta.percent.toFixed(1)}%`}{' '}
          <Text style={styles.statTrendMuted}>{deltaLabel}</Text>
        </Text>
      </View>
    </View>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function PagerBtn({
  icon,
  disabled,
  onPress,
}: {
  icon: FeatherIconName;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.pagerBtn, disabled && styles.pagerBtnDisabled]}
    >
      <Feather
        name={icon}
        size={16}
        color={disabled ? colors.textMuted : colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  columns: { gap: spacing.md },
  columnsRow: { flexDirection: 'row', alignItems: 'stretch' },
  colMain: { flex: 2 },
  colSide: { flex: 1, minWidth: 260, gap: spacing.md },
  third: { flex: 1, minWidth: 260 },

  hero: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: 'center',
    ...shadows.card,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.textOnPrimary,
    fontWeight: '800',
  },
  heroText: {
    ...typography.bodySmall,
    // Blanco translúcido: legible sobre el verde del hero en claro y oscuro.
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: spacing.sm,
    lineHeight: 20,
    maxWidth: 520,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
  },
  heroBtnLight: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroBtnLightText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '800',
  },
  heroBtnSolid: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroBtnSolidText: {
    ...typography.bodySmall,
    // Verde oscuro fijo: el fondo (primaryLight) es igual en ambos temas, así
    // que el texto no debe seguir la paleta (evita verde-sobre-verde en oscuro).
    color: '#065a28',
    fontWeight: '800',
  },

  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'center',
    ...shadows.card,
  },
  statLabel: { ...typography.label, color: colors.textMuted },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  statTrendText: { ...typography.caption, fontWeight: '800' },
  statTrendMuted: { color: colors.textMuted, fontWeight: '400' },

  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  filterLabel: { ...typography.label, color: colors.textMuted },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    padding: 3,
    flexWrap: 'wrap',
  },
  segBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  segBtnActive: { backgroundColor: colors.surface },
  segText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  segTextActive: { color: colors.text },
  csvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  csvText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },

  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.info,
  },
  activeText: {
    ...typography.caption,
    color: colors.info,
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },

  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  colName: { flex: 2, minWidth: 180 },
  colStatus: { width: 110 },
  colOrders: { width: 80 },
  colValue: { width: 120 },
  colLast: { width: 120 },
  colActions: { width: 44, alignItems: 'flex-end' },
  nameCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nameText: { flex: 1 },
  name: { ...typography.bodySmall, color: colors.text, fontWeight: '700' },
  sub: { ...typography.caption, color: colors.textMuted },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: { backgroundColor: colors.surfaceMuted },
  detail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailItem: { minWidth: 130 },
  detailLabel: { ...typography.caption, color: colors.textMuted },
  detailValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginTop: 2,
  },
  tableFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  footText: { ...typography.caption, color: colors.textSecondary },
  pager: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pagerBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagerBtnDisabled: { opacity: 0.4 },
  pagerText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  emptyRow: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    padding: spacing.lg,
  },
  empty: { ...typography.bodySmall, color: colors.textSecondary },

  pulseText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 17,
  },
  tagBlock: { marginBottom: spacing.md },
  tagLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    gap: spacing.sm,
  },
  tagName: { ...typography.bodySmall, color: colors.text, flex: 1 },
  tagCount: { ...typography.bodySmall, color: colors.text, fontWeight: '800' },
  track: {
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },

  crmCard: {
    flex: 1,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crmIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  crmTitle: { ...typography.h3, color: colors.text, fontWeight: '800' },
  crmText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  crmBtn: {
    backgroundColor: colors.black,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  crmBtnText: {
    ...typography.bodySmall,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
});
