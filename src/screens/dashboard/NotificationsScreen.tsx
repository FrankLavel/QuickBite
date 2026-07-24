/**
 * screens/dashboard/NotificationsScreen.tsx
 * Centro de notificaciones del restaurante. Las alertas se derivan del estado
 * real del negocio: pedidos, platillos agotados y promociones (cupones/banners).
 * El estado "leído" es local a la sesión (no hay colección de notificaciones
 * del restaurante en Firestore).
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ComponentProps } from 'react';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { SectionCard } from '../../components/SectionCard';
import { Button } from '../../components/Button';
import { ProductImage } from '../../components/ProductImage';
import { useOrders } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';
import { usePromotions } from '../../hooks/usePromotions';
import {
  isCouponExpired,
  isCouponExhausted,
} from '../../services/couponService';
import { ORDER_STATUS } from '../../utils/constants';
import type { MainStackParamList } from '../../types/navigation';
import { colors, radius, shadows, spacing, typography } from '../../utils/theme';
import { formatCurrency } from '../../utils/format';
import { notifyError } from '../../utils/notify';

type FeatherIconName = ComponentProps<typeof Feather>['name'];
type Category = 'order' | 'promo' | 'system';
type Tab = 'all' | Category;
type Tone = 'primary' | 'info' | 'success' | 'warning' | 'danger';

interface AlertItem {
  id: string;
  category: Category;
  title: string;
  body: string;
  date: Date;
  icon: FeatherIconName;
  tone: Tone;
  /** Resalta la tarjeta (barra lateral) por requerir acción inmediata. */
  priority?: boolean;
  /** Miniatura en lugar del icono (banners promocionales). */
  imageUri?: string;
  /** Pedido pendiente que puede aceptarse desde la notificación. */
  pendingOrderId?: string;
}

const TONE_COLORS: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: colors.primarySoft, fg: colors.primary },
  info: { bg: colors.infoSoft, fg: colors.info },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

const CATEGORY_LABELS: Record<Category, string> = {
  order: 'Pedido',
  promo: 'Promoción',
  system: 'Sistema',
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

function dayLabel(d: Date, now: Date): string {
  const diff = daysAgo(d, now);
  if (diff === 0) return 'HOY';
  if (diff === 1) return 'AYER';
  return d
    .toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase();
}

function timeLabel(d: Date, now: Date): string {
  const diff = daysAgo(d, now);
  const time = d.toLocaleTimeString('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (diff === 0) {
    const secs = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (secs < 60) return 'hace un momento';
    const m = Math.floor(secs / 60);
    if (m < 60) return `hace ${m} min`;
    return `hace ${Math.floor(m / 60)} h`;
  }
  if (diff === 1) return `Ayer, ${time}`;
  return `${d.toLocaleDateString('es-MX')}, ${time}`;
}

export function NotificationsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { orders, loading, refresh, setStatus } = useOrders();
  const { products } = useProducts();
  const { coupons, offers } = usePromotions();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;

  const [tab, setTab] = useState<Tab>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(8);

  const alerts = useMemo<AlertItem[]>(() => {
    const now = new Date();
    const items: AlertItem[] = [];

    // --- Pedidos ---
    orders.slice(0, 40).forEach((order) => {
      const date = toDateSafe(order.createdAt) ?? now;
      const shortId = `#${order.id.slice(0, 6).toUpperCase()}`;
      const units = order.items.reduce((s, i) => s + i.qty, 0);
      const money = formatCurrency(order.total);

      switch (order.status) {
        case ORDER_STATUS.PENDING:
          items.push({
            id: `order-${order.id}`,
            category: 'order',
            title: `Nuevo pedido ${shortId}`,
            body: `${units} artículos por ${money}. Requiere aceptación para entrar a cocina.`,
            date,
            icon: 'shopping-bag',
            tone: 'primary',
            priority: true,
            pendingOrderId: order.id,
          });
          break;
        case ORDER_STATUS.READY:
          items.push({
            id: `order-${order.id}`,
            category: 'order',
            title: `Pedido listo ${shortId}`,
            body: `${units} artículos listos para salir. Marca "en camino" cuando lo despaches.`,
            date,
            icon: 'check-circle',
            tone: 'success',
          });
          break;
        case ORDER_STATUS.ON_THE_WAY:
          items.push({
            id: `order-${order.id}`,
            category: 'order',
            title: `Pedido en camino ${shortId}`,
            body: `${money} en ruta a ${order.deliveryAddress.street}.`,
            date,
            icon: 'truck',
            tone: 'info',
          });
          break;
        case ORDER_STATUS.DELIVERED:
          items.push({
            id: `order-${order.id}`,
            category: 'order',
            title: `Pedido entregado ${shortId}`,
            body: `Entrega completada por ${money}.`,
            date,
            icon: 'check-circle',
            tone: 'success',
          });
          break;
        case ORDER_STATUS.CANCELLED:
        case ORDER_STATUS.REJECTED:
          items.push({
            id: `order-${order.id}`,
            category: 'order',
            title: `Pedido cancelado ${shortId}`,
            body: `El pedido de ${money} no se completó.`,
            date,
            icon: 'x-circle',
            tone: 'danger',
          });
          break;
        default:
          items.push({
            id: `order-${order.id}`,
            category: 'order',
            title: `Pedido en preparación ${shortId}`,
            body: `${units} artículos en cocina por ${money}.`,
            date,
            icon: 'clock',
            tone: 'warning',
          });
      }
    });

    // --- Sistema: platillos agotados ---
    products
      .filter((p) => !p.isAvailable)
      .slice(0, 10)
      .forEach((p) => {
        items.push({
          id: `stock-${p.id}`,
          category: 'system',
          title: `Platillo agotado: ${p.name}`,
          body: `"${p.name}" está marcado como no disponible y no aparece en la app.`,
          date: now,
          icon: 'alert-triangle',
          tone: 'warning',
        });
      });

    // --- Promociones: cupones ---
    coupons.forEach((c) => {
      if (isCouponExpired(c)) {
        items.push({
          id: `coupon-exp-${c.code}`,
          category: 'promo',
          title: `Cupón vencido: ${c.code}`,
          body: 'Este cupón ya no se puede canjear. Actualiza su vigencia o desactívalo.',
          date: c.expiresAt ?? now,
          icon: 'tag',
          tone: 'danger',
        });
      } else if (isCouponExhausted(c)) {
        items.push({
          id: `coupon-out-${c.code}`,
          category: 'promo',
          title: `Cupón agotado: ${c.code}`,
          body: `Se alcanzó el límite de ${c.maxUses} usos. Amplía el límite si quieres seguir promocionándolo.`,
          date: now,
          icon: 'tag',
          tone: 'warning',
        });
      } else if (c.isActive && c.expiresAt) {
        const daysLeft = Math.ceil(
          (c.expiresAt.getTime() - now.getTime()) / 86400000
        );
        if (daysLeft >= 0 && daysLeft <= 7) {
          items.push({
            id: `coupon-soon-${c.code}`,
            category: 'promo',
            title: `El cupón ${c.code} vence pronto`,
            body: `Quedan ${daysLeft} día(s) de vigencia y lleva ${c.usedCount} de ${c.maxUses} usos.`,
            date: now,
            icon: 'clock',
            tone: 'warning',
          });
        }
      }
    });

    // --- Promociones: banners visibles ---
    offers
      .filter((o) => o.isActive)
      .slice(0, 5)
      .forEach((o) => {
        items.push({
          id: `offer-${o.id}`,
          category: 'promo',
          title: `Banner activo: ${o.title}`,
          body: o.description || 'Visible en la pantalla principal de la app.',
          date: now,
          icon: 'image',
          tone: 'primary',
          imageUri: o.image,
        });
      });

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [orders, products, coupons, offers]);

  const counts = useMemo(() => {
    const now = new Date();
    const unread = alerts.filter((a) => !readIds.has(a.id)).length;
    const ordersToday = alerts.filter(
      (a) => a.category === 'order' && daysAgo(a.date, now) === 0
    ).length;
    const systemIssues = alerts.filter((a) => a.category === 'system').length;
    return { unread, ordersToday, systemIssues };
  }, [alerts, readIds]);

  const filtered = useMemo(
    () => (tab === 'all' ? alerts : alerts.filter((a) => a.category === tab)),
    [alerts, tab]
  );

  const visible = filtered.slice(0, visibleCount);

  const groups = useMemo(() => {
    const now = new Date();
    const map = new Map<string, AlertItem[]>();
    visible.forEach((a) => {
      const label = dayLabel(a.date, now);
      const list = map.get(label) ?? [];
      list.push(a);
      map.set(label, list);
    });
    return Array.from(map.entries());
  }, [visible]);

  const markAllRead = () => setReadIds(new Set(alerts.map((a) => a.id)));
  const markRead = (id: string) =>
    setReadIds((prev) => new Set(prev).add(id));

  const acceptOrder = async (orderId: string, alertId: string) => {
    try {
      await setStatus(orderId, ORDER_STATUS.ACCEPTED);
      markRead(alertId);
    } catch {
      notifyError('No se pudo aceptar el pedido');
    }
  };

  const tabs: [Tab, string][] = [
    ['all', 'Todas'],
    ['order', 'Pedidos'],
    ['promo', 'Promos'],
    ['system', 'Sistema'],
  ];

  // Tarjeta de acción sugerida, según el estado real del negocio.
  const suggestion = (() => {
    const pending = alerts.filter((a) => a.pendingOrderId).length;
    if (pending > 0) {
      return {
        icon: 'zap' as FeatherIconName,
        title: `${pending} pedido(s) por aceptar`,
        body: 'Acéptalos cuanto antes para que entren a cocina y no se retrase la entrega.',
        cta: 'Ir a Pedidos',
        onPress: () => navigation.navigate('Pedidos'),
      };
    }
    if (counts.systemIssues > 0) {
      return {
        icon: 'alert-triangle' as FeatherIconName,
        title: `${counts.systemIssues} platillo(s) agotado(s)`,
        body: 'Los platillos no disponibles no se muestran en la app. Reactívalos cuando tengas existencia.',
        cta: 'Ir al Menú',
        onPress: () => navigation.navigate('Menu'),
      };
    }
    if (coupons.filter((c) => c.isActive).length === 0) {
      return {
        icon: 'gift' as FeatherIconName,
        title: 'Sin promociones activas',
        body: 'Un cupón de descuento es la forma más rápida de reactivar clientes que no ordenan.',
        cta: 'Crear promoción',
        onPress: () => navigation.navigate('Promociones'),
      };
    }
    return {
      icon: 'check-circle' as FeatherIconName,
      title: 'Todo en orden',
      body: 'No hay pedidos pendientes ni platillos agotados. Tu operación está al día.',
      cta: 'Ver panel',
      onPress: () => navigation.navigate('Panel'),
    };
  })();

  return (
    <ScreenShell searchPlaceholder="Buscar alertas o pedidos...">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <View style={styles.pageHead}>
          <View style={styles.pageHeadText}>
            <Text style={styles.title}>Centro de notificaciones</Text>
            <Text style={styles.subtitle}>
              Gestiona tus alertas, cambios de pedidos y avisos del sistema
            </Text>
          </View>
          <View style={styles.segment}>
            {tabs.map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.segBtn, tab === key && styles.segBtnActive]}
                onPress={() => {
                  setTab(key);
                  setVisibleCount(8);
                }}
              >
                <Text
                  style={[styles.segText, tab === key && styles.segTextActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.columns, wide && styles.columnsRow]}>
          {/* Columna izquierda: resumen + acción sugerida */}
          <View style={wide ? styles.colSide : undefined}>
            <SectionCard title="Resumen">
              <SummaryRow
                label="Sin leer"
                value={String(counts.unread)}
                highlight={counts.unread > 0}
              />
              <SummaryRow
                label="Alertas de pedidos"
                value={`${counts.ordersToday} hoy`}
              />
              <SummaryRow
                label="Incidencias"
                value={
                  counts.systemIssues > 0
                    ? String(counts.systemIssues)
                    : 'Ninguna'
                }
                danger={counts.systemIssues > 0}
              />
              <Button
                title="Marcar todas como leídas"
                variant="outline"
                onPress={markAllRead}
                style={styles.markBtn}
              />
            </SectionCard>

            <View style={styles.suggestCard}>
              <View style={styles.suggestIcon}>
                <Feather
                  name={suggestion.icon}
                  size={20}
                  color={colors.textOnPrimary}
                />
              </View>
              <Text style={styles.suggestTitle}>{suggestion.title}</Text>
              <Text style={styles.suggestBody}>{suggestion.body}</Text>
              <TouchableOpacity
                style={styles.suggestBtn}
                onPress={suggestion.onPress}
              >
                <Text style={styles.suggestBtnText}>{suggestion.cta}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Columna derecha: lista agrupada por día */}
          <View style={wide ? styles.colMain : undefined}>
            {groups.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Feather name="bell" size={26} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyText}>
                  No hay notificaciones en esta vista.
                </Text>
              </View>
            ) : (
              groups.map(([label, items]) => (
                <View key={label} style={styles.group}>
                  <View style={styles.groupHead}>
                    <Text style={styles.groupLabel}>{label}</Text>
                    <View style={styles.groupLine} />
                  </View>

                  {items.map((item) => {
                    const toneC = TONE_COLORS[item.tone];
                    const unread = !readIds.has(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.9}
                        onPress={() => markRead(item.id)}
                        style={[
                          styles.alertCard,
                          item.priority && unread && styles.alertCardPriority,
                        ]}
                      >
                        {item.imageUri ? (
                          <View style={styles.thumb}>
                            <ProductImage
                              uri={item.imageUri}
                              style={styles.thumbImg}
                            />
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.alertIcon,
                              { backgroundColor: toneC.bg },
                            ]}
                          >
                            <Feather
                              name={item.icon}
                              size={18}
                              color={toneC.fg}
                            />
                          </View>
                        )}

                        <View style={styles.alertBody}>
                          <View style={styles.alertTopRow}>
                            <Text
                              style={[
                                styles.alertTitle,
                                unread && styles.alertTitleUnread,
                              ]}
                              numberOfLines={1}
                            >
                              {item.title}
                            </Text>
                            <Text style={styles.alertTime}>
                              {timeLabel(item.date, new Date())}
                            </Text>
                          </View>

                          <Text style={styles.alertText}>{item.body}</Text>

                          <View style={styles.alertFooter}>
                            <View
                              style={[
                                styles.catChip,
                                { backgroundColor: toneC.bg },
                              ]}
                            >
                              <Text
                                style={[styles.catText, { color: toneC.fg }]}
                              >
                                {CATEGORY_LABELS[item.category]}
                              </Text>
                            </View>
                            {unread ? <View style={styles.unreadDot} /> : null}
                          </View>

                          {item.pendingOrderId ? (
                            <View style={styles.actions}>
                              <Button
                                title="Aceptar pedido"
                                onPress={() =>
                                  acceptOrder(item.pendingOrderId!, item.id)
                                }
                                style={styles.actionBtn}
                              />
                              <Button
                                title="Detalles"
                                variant="outline"
                                onPress={() => navigation.navigate('Pedidos')}
                                style={styles.actionBtn}
                              />
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            )}

            {filtered.length > visibleCount ? (
              <TouchableOpacity
                style={styles.loadMore}
                onPress={() => setVisibleCount((n) => n + 8)}
              >
                <Feather
                  name="chevrons-down"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.loadMoreText}>
                  Cargar notificaciones anteriores
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <View style={styles.sumRow}>
      <Text style={styles.sumLabel}>{label}</Text>
      <View
        style={[
          styles.sumBadge,
          highlight && styles.sumBadgeHighlight,
          danger && styles.sumBadgeDanger,
        ]}
      >
        <Text
          style={[
            styles.sumValue,
            highlight && styles.sumValueHighlight,
            danger && styles.sumValueDanger,
          ]}
        >
          {value}
        </Text>
      </View>
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
  columns: { gap: spacing.md },
  columnsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  colSide: { flex: 1, minWidth: 250, gap: spacing.md },
  colMain: { flex: 2.4 },
  sumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sumLabel: { ...typography.bodySmall, color: colors.textSecondary },
  sumBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  sumBadgeHighlight: { backgroundColor: colors.dangerSoft },
  sumBadgeDanger: { backgroundColor: colors.warningSoft },
  sumValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '800',
  },
  sumValueHighlight: { color: colors.danger },
  sumValueDanger: { color: colors.warning },
  markBtn: { marginTop: spacing.md },
  suggestCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  suggestIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  suggestTitle: {
    ...typography.h3,
    color: colors.textOnPrimary,
    fontWeight: '800',
  },
  suggestBody: {
    ...typography.caption,
    // Blanco translúcido: legible sobre el verde de la tarjeta en ambos temas.
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  suggestBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  suggestBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
  },
  group: { marginBottom: spacing.md },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  groupLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  groupLine: { flex: 1, height: 1, backgroundColor: colors.border },
  alertCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  alertCardPriority: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  thumbImg: { width: '100%', height: '100%' },
  alertBody: { flex: 1 },
  alertTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  alertTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  alertTitleUnread: { fontWeight: '800' },
  alertTime: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  alertText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  catChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  catText: {
    ...typography.caption,
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primaryLight,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  actionBtn: { minWidth: 130 },
  loadMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
  },
  loadMoreText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
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
