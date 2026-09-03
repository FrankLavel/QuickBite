/**
 * screens/OrderDetailScreen.tsx
 * Detalle de un pedido y acciones del repartidor según el estado:
 *   disponible → Reclamar · reclamado → Recogí · en camino → Entregué.
 * Incluye botones "Cómo llegar" (recogida/entrega) y comparte la ubicación en
 * primer plano mientras el pedido está en camino. Theme-aware.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  listenOrder,
  pickUpOrder,
  markDelivered,
  getRestaurantInfo,
  type RestaurantInfo,
} from '../services/deliveryService';
import {
  startSharingLocation,
  clearTracking,
  type LocationSharer,
} from '../services/locationService';
import { ORDER_STATUS } from '../utils/constants';
import { formatCurrency } from '../utils/format';
import {
  directionsUrl,
  haversineKm,
  formatDistance,
  type Coords,
} from '../utils/geo';
import type { Order } from '../types/order';
import type { RootStackParamList } from '../navigation/types';
import { radius, spacing, type Colors } from '../utils/theme';

export function OrderDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const { orderId } = route.params;
  const { driver } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState<'on' | 'denied' | null>(null);

  useEffect(() => listenOrder(orderId, setOrder), [orderId]);

  useEffect(() => {
    if (order?.restaurantId) {
      getRestaurantInfo(order.restaurantId).then(setRestaurant);
    }
  }, [order?.restaurantId]);

  const isMineOnTheWay =
    !!driver &&
    !!order &&
    order.driverId === driver.uid &&
    order.status === ORDER_STATUS.ON_THE_WAY;

  useEffect(() => {
    if (!isMineOnTheWay || !driver) return;
    let sharer: LocationSharer | null = null;
    let cancelled = false;
    setSharing(null);
    startSharingLocation(orderId, driver.uid).then((s) => {
      if (cancelled) {
        s?.stop();
        return;
      }
      sharer = s;
      setSharing(s ? 'on' : 'denied');
    });
    return () => {
      cancelled = true;
      sharer?.stop();
      setSharing(null);
    };
  }, [isMineOnTheWay, driver, orderId]);

  if (order === undefined) {
    return <SafeAreaView style={styles.safe} />;
  }
  if (order === null) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState icon="alert-circle-outline" title="El pedido ya no existe" />
      </SafeAreaView>
    );
  }

  const mine = !!driver && order.driverId === driver.uid;

  const pickupCoords: Coords | null =
    restaurant?.lat != null && restaurant?.lng != null
      ? { lat: restaurant.lat, lng: restaurant.lng }
      : null;
  const dropCoords: Coords | null = order.deliveryAddress?.coords
    ? { lat: order.deliveryAddress.coords.lat, lng: order.deliveryAddress.coords.lng }
    : null;
  const legKm =
    pickupCoords && dropCoords ? haversineKm(pickupCoords, dropCoords) : null;

  async function run(action: () => Promise<void>, errorMsg: string) {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      Alert.alert('Error', (e as Error)?.message ?? errorMsg);
    } finally {
      setBusy(false);
    }
  }

  function onPickUp() {
    void run(() => pickUpOrder(order!.id), 'No se pudo actualizar el pedido.');
  }

  function onDeliver() {
    Alert.alert('Confirmar entrega', '¿Marcar este pedido como entregado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Entregado',
        onPress: () =>
          void run(async () => {
            await markDelivered(order!.id);
            await clearTracking(order!.id);
          }, 'No se pudo marcar como entregado.'),
      },
    ]);
  }

  function callCustomer() {
    if (order?.customerPhone) Linking.openURL(`tel:${order.customerPhone}`);
  }

  function goToPickup() {
    const dest =
      pickupCoords ??
      [restaurant?.name, restaurant?.address].filter(Boolean).join(', ');
    if (dest) Linking.openURL(directionsUrl(dest));
  }

  function goToDropoff() {
    const addr = order!.deliveryAddress;
    const dest =
      dropCoords ??
      [addr?.street, addr?.city].filter(Boolean).join(', ');
    if (dest) Linking.openURL(directionsUrl(dest));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={styles.id}>#{order.id.slice(0, 6).toUpperCase()}</Text>
          <StatusBadge status={order.status} />
        </View>

        {/* Recogida */}
        <Section icon="restaurant-outline" title="Recoger en" colors={colors}>
          <Text style={styles.value}>{restaurant?.name ?? 'Restaurante'}</Text>
          {restaurant?.address ? (
            <Text style={styles.muted}>{restaurant.address}</Text>
          ) : null}
          <DirectionsButton label="Cómo llegar a la recogida" onPress={goToPickup} colors={colors} />
        </Section>

        {/* Entrega */}
        <Section icon="location-outline" title="Entregar en" colors={colors}>
          <Text style={styles.value}>
            {order.deliveryAddress?.street}
            {order.deliveryAddress?.city
              ? `, ${order.deliveryAddress.city}`
              : ''}
          </Text>
          {order.deliveryAddress?.references ? (
            <Text style={styles.muted}>{order.deliveryAddress.references}</Text>
          ) : null}
          {legKm != null ? (
            <Text style={styles.muted}>
              ~{formatDistance(legKm)} desde el restaurante
            </Text>
          ) : null}
          <DirectionsButton label="Cómo llegar a la entrega" onPress={goToDropoff} colors={colors} />
        </Section>

        {/* Cliente */}
        <Section icon="person-outline" title="Cliente" colors={colors}>
          <Text style={styles.value}>{order.customerName ?? 'Cliente'}</Text>
          {order.customerPhone ? (
            <Pressable onPress={callCustomer} style={styles.callRow}>
              <Ionicons name="call" size={16} color={colors.brandDark} />
              <Text style={styles.callText}>{order.customerPhone}</Text>
            </Pressable>
          ) : null}
        </Section>

        {/* Artículos */}
        <Section icon="list-outline" title="Pedido" colors={colors}>
          {order.items?.map((it, i) => (
            <View key={`${it.productId}-${i}`} style={styles.itemRow}>
              <Text style={styles.itemQty}>{it.qty}×</Text>
              <Text style={styles.itemName}>{it.name}</Text>
              <Text style={styles.itemPrice}>{formatCurrency(it.subtotal)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
          </View>
          <Text style={styles.muted}>
            Pago:{' '}
            {order.paymentMethod === 'cash'
              ? 'Efectivo (cobrar al entregar)'
              : 'Pagado con tarjeta'}
          </Text>
        </Section>
      </ScrollView>

      {/* Acción principal */}
      <View style={styles.actionBar}>
        {mine && order.status === ORDER_STATUS.READY ? (
          <Button label="Recogí el pedido" onPress={onPickUp} loading={busy} />
        ) : mine && order.status === ORDER_STATUS.ON_THE_WAY ? (
          <>
            {sharing === 'on' ? (
              <View style={styles.shareRow}>
                <Ionicons name="navigate" size={14} color={colors.info} />
                <Text style={styles.shareText}>Compartiendo tu ubicación…</Text>
              </View>
            ) : sharing === 'denied' ? (
              <View style={styles.shareRow}>
                <Ionicons name="warning" size={14} color={colors.warning} />
                <Text style={[styles.shareText, { color: colors.warning }]}>
                  Sin permiso de ubicación. Actívalo para compartir tu ruta.
                </Text>
              </View>
            ) : null}
            <Button
              label="Marcar como entregado"
              onPress={onDeliver}
              loading={busy}
            />
          </>
        ) : mine && order.status === ORDER_STATUS.DELIVERED ? (
          <Text style={styles.doneText}>✅ Entrega completada</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function Section({
  icon,
  title,
  colors,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  colors: Colors;
  children: React.ReactNode;
}) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={16} color={colors.textMuted} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function DirectionsButton({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: Colors;
}) {
  const styles = makeStyles(colors);
  return (
    <Pressable onPress={onPress} style={styles.dirBtn}>
      <Ionicons name="navigate-circle-outline" size={18} color={colors.brand} />
      <Text style={styles.dirBtnText}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    id: { fontSize: 20, fontWeight: '800', color: c.text },
    section: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: spacing.xs,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    value: { fontSize: 16, fontWeight: '600', color: c.text },
    muted: { fontSize: 13, color: c.textMuted },
    callRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.xs,
    },
    callText: { fontSize: 15, fontWeight: '700', color: c.brandDark },
    dirBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.brand,
      alignSelf: 'flex-start',
    },
    dirBtnText: { fontSize: 14, fontWeight: '700', color: c.brand },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 4,
    },
    itemQty: { fontSize: 14, fontWeight: '800', color: c.brandDark, width: 32 },
    itemName: { flex: 1, fontSize: 15, color: c.text },
    itemPrice: { fontSize: 14, color: c.textMuted },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    totalLabel: { fontSize: 16, fontWeight: '800', color: c.text },
    totalValue: { fontSize: 16, fontWeight: '800', color: c.text },
    actionBar: {
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    doneText: {
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '700',
      color: c.textMuted,
      paddingVertical: spacing.sm,
    },
    shareRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginBottom: spacing.sm,
    },
    shareText: { fontSize: 13, fontWeight: '600', color: c.info },
  });
