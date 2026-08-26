import { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, ActivityIndicator, DimensionValue } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE, Marker, Region } from 'react-native-maps';
import { Icon, IconName } from '@/components/ui/Icon';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { palette } from '@/constants/colors';
import { ordersService } from '@/services/orders.service';
import { restaurantsService } from '@/services/restaurants.service';
import { DeliveryTracking, Order, OrderStatus } from '@/types/order.types';
import { Restaurant } from '@/types/restaurant.types';
import { useTranslation } from '@/hooks/useTranslation';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const STEPS: { labelKey: string; icon: IconName }[] = [
  { labelKey: 'tracking.stepConfirmed', icon: 'receipt-long' },
  { labelKey: 'tracking.stepKitchen', icon: 'restaurant' },
  { labelKey: 'tracking.stepOnWay', icon: 'delivery-dining' },
  { labelKey: 'tracking.stepDelivered', icon: 'home' },
];

/**
 * Índice del paso visual según el estado del pedido. 'pending' aún no enciende
 * ningún paso: el pedido está esperando que el restaurante lo acepte. El primer
 * paso ("Confirmado") solo se enciende cuando el restaurante pasa a 'accepted'.
 */
function stepIndex(status: OrderStatus): number {
  switch (status) {
    case 'accepted':
      return 0;
    case 'preparing':
    case 'ready':
      return 1;
    case 'on_the_way':
      return 2;
    case 'delivered':
      return 3;
    default:
      return -1; // pending (sin aceptar aún), rejected, cancelled
  }
}

type LatLng = { lat: number; lng: number };

/** Región del mapa que encuadra al repartidor y (si existe) el destino. */
function mapRegion(driver: DeliveryTracking, dest?: LatLng): Region {
  if (!dest) {
    return {
      latitude: driver.lat,
      longitude: driver.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }
  return {
    latitude: (driver.lat + dest.lat) / 2,
    longitude: (driver.lng + dest.lng) / 2,
    latitudeDelta: Math.max(0.008, Math.abs(driver.lat - dest.lat) * 2.4),
    longitudeDelta: Math.max(0.008, Math.abs(driver.lng - dest.lng) * 2.4),
  };
}

export default function TrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Suscripción en tiempo real al pedido.
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    const unsub = ordersService.listenOrder(orderId, (o) => {
      setOrder(o);
      setLoading(false);
    });
    return unsub;
  }, [orderId]);

  // Restaurante asociado.
  useEffect(() => {
    if (!order?.restaurantId) return;
    restaurantsService.getById(order.restaurantId).then(setRestaurant);
  }, [order?.restaurantId]);

  // Ubicación en vivo del repartidor (solo mientras el pedido va en camino).
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  useEffect(() => {
    if (!orderId || order?.status !== 'on_the_way') {
      setTracking(null);
      return;
    }
    return ordersService.listenTracking(orderId, setTracking);
  }, [orderId, order?.status]);

  const submitRating = async (value: number) => {
    if (!orderId || submittingRating) return;
    setRating(value);
    setSubmittingRating(true);
    try {
      await ordersService.addRating(orderId, value);
    } finally {
      setSubmittingRating(false);
    }
  };

  const openCancelDialog = () => {
    setCancelError('');
    setConfirmVisible(true);
  };

  const doCancel = async () => {
    if (!orderId || cancelling) return;
    setCancelling(true);
    setCancelError('');
    try {
      await ordersService.cancelOrder(orderId);
      setConfirmVisible(false);
    } catch {
      setCancelError(t('tracking.cancelError'));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="m-4 w-10 h-10 bg-surface-container rounded-full items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Icon name="arrow-back" color={palette.onSurface} />
        </TouchableOpacity>
        <View className="flex-1 items-center justify-center gap-2 px-6">
          <Icon name="error-outline" size={40} color={palette.outline} />
          <Text className="text-on-surface-variant text-center">{t('tracking.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const current = stepIndex(order.status);
  const isRejected = order.status === 'rejected';
  const isCancelled = order.status === 'cancelled';
  const isTerminated = isRejected || isCancelled; // sin progreso ni ETA
  const isDelivered = order.status === 'delivered';
  const canCancel = order.status === 'pending';
  const progressWidth: DimensionValue =
    current > 0 ? `${(current / (STEPS.length - 1)) * 100}%` : '0%';
  const eta = order.estimatedTime ? `${order.estimatedTime} min` : restaurant?.deliveryTime ?? '';

  return (
    <View className="flex-1 bg-background">
      {/* Hero: mapa en vivo mientras el repartidor va en camino; si no, portada. */}
      <View style={{ height: SCREEN_HEIGHT * 0.4 }} className="relative bg-surface-container">
        {order.status === 'on_the_way' && tracking ? (
          <>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              region={mapRegion(tracking, order.deliveryAddress?.coords)}
            >
              <Marker
                coordinate={{ latitude: tracking.lat, longitude: tracking.lng }}
                title={t('tracking.driverHere')}
                pinColor={palette.primary}
              />
              {order.deliveryAddress?.coords && (
                <Marker
                  coordinate={{
                    latitude: order.deliveryAddress.coords.lat,
                    longitude: order.deliveryAddress.coords.lng,
                  }}
                  title={t('tracking.destHere')}
                />
              )}
            </MapView>
            <View className="absolute top-4 right-4 flex-row items-center gap-1.5 bg-black/60 rounded-full px-3 py-1.5">
              <View className="w-2 h-2 rounded-full bg-primary" />
              <Text className="text-white text-xs font-bold">{t('tracking.live')}</Text>
            </View>
          </>
        ) : (
          <>
            {restaurant?.coverImage && (
              <Image source={{ uri: restaurant.coverImage }} className="w-full h-full" resizeMode="cover" />
            )}
            <View className="absolute inset-0 bg-black/30" />
          </>
        )}
      </View>

      <SafeAreaView edges={['top']} className="absolute top-0 left-0">
        <TouchableOpacity
          onPress={() => router.back()}
          className="m-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Icon name="arrow-back" color={palette.onSurface} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Sheet */}
      <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 w-full p-4">
        <View
          className="bg-surface-container-lowest rounded-3xl p-6 gap-8"
          style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } }}
        >
          <View>
            <Text className="text-2xl font-bold text-on-background">
              {t(`status.${order.status}`)}
            </Text>
            {!isTerminated && !!eta && (
              <Text className="text-secondary text-sm">
                {t('tracking.eta', { eta })}
              </Text>
            )}
            {restaurant && (
              <Text className="text-secondary text-sm">
                {t('tracking.from', { name: restaurant.name })}
              </Text>
            )}
            {isRejected && !!order.rejectionReason && (
              <View className="mt-3 flex-row items-start gap-2 bg-error/10 border border-error/30 rounded-xl p-3">
                <Icon name="info" color={palette.error} size={18} />
                <View className="flex-1">
                  <Text className="text-error font-bold text-sm">{t('tracking.rejectedReason')}</Text>
                  <Text className="text-on-surface-variant text-sm mt-0.5">{order.rejectionReason}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Progress steps (oculto si fue rechazado o cancelado) */}
          {!isTerminated && (
            <View className="flex-row justify-between relative">
              <View className="absolute top-5 left-5 right-5 h-[2px] bg-surface-container-highest" />
              <View className="absolute top-5 left-5 h-[2px] bg-primary" style={{ width: progressWidth }} />
              {STEPS.map((step, i) => {
                const done = i <= current;
                return (
                  <View key={step.labelKey} className="items-center gap-2" style={{ opacity: done ? 1 : 0.4 }}>
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        done ? 'bg-primary' : 'bg-surface-container'
                      }`}
                    >
                      <Icon name={step.icon} color={done ? '#ffffff' : palette.outline} size={16} />
                    </View>
                    <Text className={`text-[10px] ${done ? 'font-bold text-on-surface' : 'text-secondary'}`}>
                      {t(step.labelKey)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Calificación al entregar */}
          {isDelivered && (
            <View className="bg-background p-4 rounded-2xl items-center gap-3">
              {order.rating ? (
                <Text className="text-on-surface font-bold">{t('tracking.thanks')}</Text>
              ) : (
                <>
                  <Text className="text-on-surface font-bold">{t('tracking.rateQuestion')}</Text>
                  <View className="flex-row gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <TouchableOpacity
                        key={value}
                        onPress={() => submitRating(value)}
                        disabled={submittingRating}
                        accessibilityRole="button"
                        accessibilityLabel={t('a11y.rateStars', { n: value })}
                        accessibilityState={{ selected: value <= rating }}
                      >
                        <Icon
                          name={value <= rating ? 'star' : 'star-border'}
                          color={palette.star}
                          size={36}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Cancelar pedido (solo mientras sigue pendiente de aceptación) */}
          {canCancel && (
            <TouchableOpacity
              onPress={openCancelDialog}
              activeOpacity={0.8}
              className="border border-error rounded-full h-12 flex-row items-center justify-center gap-2"
            >
              <Icon name="close" color={palette.error} size={18} />
              <Text className="text-error text-sm font-bold">{t('tracking.cancelOrder')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmVisible}
        title={t('tracking.cancelTitle')}
        message={t('tracking.cancelMessage')}
        confirmLabel={t('tracking.cancelConfirm')}
        cancelLabel={t('tracking.cancelDismiss')}
        onConfirm={doCancel}
        onCancel={() => setConfirmVisible(false)}
        destructive
        loading={cancelling}
        errorMessage={cancelError}
      />
    </View>
  );
}
