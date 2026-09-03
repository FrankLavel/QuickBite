import { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { ordersService } from '@/services/orders.service';
import { restaurantsService } from '@/services/restaurants.service';
import { useTranslation } from '@/hooks/useTranslation';
import { Order } from '@/types/order.types';
import { Restaurant } from '@/types/restaurant.types';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    let active = true;
    ordersService
      .getById(orderId)
      .then(async (o) => {
        if (!active) return;
        setOrder(o);
        if (o) {
          const r = await restaurantsService.getById(o.restaurantId);
          if (active) setRestaurant(r);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  const itemCount = order?.items.reduce((sum, i) => sum + i.qty, 0) ?? 0;
  const arrival = order?.estimatedTime ? `${order.estimatedTime} min` : restaurant?.deliveryTime ?? '25 - 35 min';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-8">
          <Icon name="check" color="#ffffff" size={48} />
        </View>
        <Text className="text-3xl font-bold text-on-background mb-2">{t('confirmation.title')}</Text>
        <Text className="text-secondary text-center mb-12">
          {t('confirmation.subtitle')}
        </Text>

        {/* Order summary card */}
        {loading ? (
          <ActivityIndicator color={palette.primary} />
        ) : (
          <View className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 mb-12">
            <View className="flex-row justify-between items-center pb-4 border-b border-outline-variant/20 mb-4">
              <View>
                <Text className="text-[10px] text-secondary uppercase font-bold">{t('confirmation.orderNum')}</Text>
                <Text className="text-primary font-bold">
                  {orderId ? orderId.slice(0, 8).toUpperCase() : '—'}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] text-secondary uppercase font-bold">{t('confirmation.arrival')}</Text>
                <Text className="font-bold text-on-surface">{arrival}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-4">
              {restaurant?.coverImage && (
                <Image source={{ uri: restaurant.coverImage }} className="w-16 h-16 rounded-xl" />
              )}
              <View className="flex-1">
                <Text className="font-bold text-sm text-on-surface" numberOfLines={1}>
                  {restaurant?.name ?? t('confirmation.yourOrder')}
                </Text>
                <Text className="text-xs text-secondary">
                  {itemCount} {itemCount === 1 ? t('confirmation.item') : t('confirmation.items')} · ${order?.total.toFixed(2) ?? '0.00'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View className="px-6 pb-6 gap-4">
        <TouchableOpacity
          onPress={() => router.replace(`/tracking?orderId=${orderId}`)}
          disabled={!orderId}
          activeOpacity={0.9}
          className="h-14 bg-primary rounded-full flex-row items-center justify-center gap-2"
          style={!orderId ? { opacity: 0.5 } : undefined}
        >
          <Icon name="my-location" color="#ffffff" size={20} />
          <Text className="text-white font-bold">{t('confirmation.track')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.9}
          className="h-14 bg-surface-container-low rounded-full items-center justify-center"
        >
          <Text className="text-primary font-bold">{t('confirmation.backHome')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
