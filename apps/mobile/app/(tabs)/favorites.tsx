import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useFavorites } from '@/hooks/useFavorites';
import { useTranslation } from '@/hooks/useTranslation';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { cuisineLabel } from '@/lib/i18n';
import { restaurantsService } from '@/services/restaurants.service';
import { Restaurant } from '@/types/restaurant.types';
import { Product } from '@/types/product.types';

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 4 },
};

const styles = StyleSheet.create({
  tabSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});

type FavMeal = { product: Product; restaurantId: string };

export default function FavoritesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'restaurants' | 'meals'>('restaurants');
  const { favoriteIds, favoriteProductIds, toggleFavorite, toggleFavoriteProduct } = useFavorites();
  const { t } = useTranslation();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [meals, setMeals] = useState<FavMeal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});

  const favKey = favoriteIds.join(',');
  useEffect(() => {
    let active = true;
    setLoadingRestaurants(true);
    restaurantsService
      .getByIds(favoriteIds)
      .then((rs) => active && setRestaurants(rs))
      .finally(() => active && setLoadingRestaurants(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favKey]);

  const mealKey = favoriteProductIds.join(',');
  useEffect(() => {
    let active = true;
    setLoadingMeals(true);
    Promise.all(
      favoriteProductIds.map(async (k) => {
        const [restId, prodId] = k.split('|');
        const product = await restaurantsService.getProductById(restId, prodId);
        return product ? { product, restaurantId: restId } : null;
      })
    )
      .then((res) => {
        if (active) setMeals(res.filter((m): m is FavMeal => m !== null));
      })
      .finally(() => active && setLoadingMeals(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealKey]);

  // Nombres de restaurante de los platillos favoritos (para dar contexto).
  useEffect(() => {
    const ids = [...new Set(meals.map((m) => m.restaurantId))];
    if (ids.length === 0) return;
    let active = true;
    restaurantsService.getByIds(ids).then((rs) => {
      if (!active) return;
      const map: Record<string, string> = {};
      rs.forEach((r) => {
        map[r.id] = r.name;
      });
      setRestaurantNames(map);
    });
    return () => {
      active = false;
    };
  }, [meals]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* TopAppBar */}
      <View className="flex-row justify-between items-center px-4 py-2 bg-background">
        <View className="flex-row items-center gap-1">
          <Icon name="favorite" color={palette.primary} />
          <Text className="text-xl font-bold text-primary">QuickBite</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-4 pt-6 pb-6 gap-6">
        {/* Title + tabs */}
        <View className="gap-4">
          <Text className="text-2xl font-bold text-on-surface">{t('favorites.title')}</Text>
          <View className="flex-row gap-2 p-1 bg-surface-container rounded-xl">
            <TouchableOpacity
              onPress={() => setTab('restaurants')}
              className={`flex-1 py-2.5 rounded-lg ${tab === 'restaurants' ? 'bg-surface-container-lowest' : ''}`}
              style={tab === 'restaurants' ? styles.tabSelected : undefined}
            >
              <Text
                className="text-sm font-bold text-center"
                style={{ color: tab === 'restaurants' ? palette.primary : palette.onSurfaceVariant }}
              >
                {t('favorites.restaurants')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTab('meals')}
              className={`flex-1 py-2.5 rounded-lg ${tab === 'meals' ? 'bg-surface-container-lowest' : ''}`}
              style={tab === 'meals' ? styles.tabSelected : undefined}
            >
              <Text
                className="text-sm font-bold text-center"
                style={{ color: tab === 'meals' ? palette.primary : palette.onSurfaceVariant }}
              >
                {t('favorites.meals')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {tab === 'restaurants' ? (
          loadingRestaurants ? (
            <View className="py-16 items-center">
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : restaurants.length === 0 ? (
            <View className="py-16 items-center gap-2">
              <Icon name="favorite-border" size={40} color={palette.outline} />
              <Text className="text-on-surface-variant text-center">
                {t('favorites.noRestaurants')}
              </Text>
            </View>
          ) : (
            <View key="fav-restaurants" className="gap-6">
              {restaurants.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  activeOpacity={0.95}
                  onPress={() => router.push(`/restaurant/${r.id}`)}
                  className="bg-surface-container-lowest rounded-2xl overflow-hidden"
                  style={cardShadow}
                >
                  <View className="h-48 relative">
                    <RemoteImage uri={r.coverImage} className="w-full h-full" fallbackIcon="restaurant" fallbackIconSize={40} />
                    <TouchableOpacity
                      onPress={() => toggleFavorite(r.id)}
                      className="absolute top-4 right-4 bg-white/90 p-2 rounded-full"
                    >
                      <Icon name="favorite" color={palette.error} size={22} />
                    </TouchableOpacity>
                    {r.isOpen && (
                      <View className="absolute bottom-4 left-4 bg-primary-container px-3 py-1 rounded-full">
                        <Text className="text-on-primary-container text-xs font-medium">{t('common.openNow')}</Text>
                      </View>
                    )}
                  </View>
                  <View className="p-4">
                    <View className="flex-row justify-between items-start mb-1">
                      <Text className="text-lg font-bold text-on-background flex-1 pr-2">{r.name}</Text>
                      <View className="flex-row items-center gap-1">
                        <Icon name="star" color={palette.star} size={18} />
                        <Text className="text-sm font-semibold text-secondary">{r.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                    <Text className="text-base text-on-surface-variant mb-4">
                      {r.cuisineTypes.map((c) => cuisineLabel(t, c)).join(' • ')} • {r.deliveryTime}
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push(`/restaurant/${r.id}`)}
                      activeOpacity={0.9}
                      className="w-full bg-primary-container py-3 rounded-full flex-row items-center justify-center gap-2"
                    >
                      <Icon name="shopping-bag" color={palette.onPrimaryContainer} size={20} />
                      <Text className="text-on-primary-container text-sm font-bold">{t('favorites.orderAgain')}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : loadingMeals ? (
          <View className="py-16 items-center">
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : meals.length === 0 ? (
          <View className="py-16 items-center gap-2">
            <Icon name="restaurant-menu" size={40} color={palette.outline} />
            <Text className="text-on-surface-variant text-center">
              {t('favorites.noMeals')}
            </Text>
          </View>
        ) : (
          <View key="fav-meals" className="flex-row flex-wrap gap-4">
            {meals.map(({ product, restaurantId }) => (
              <TouchableOpacity
                key={`${restaurantId}|${product.id}`}
                activeOpacity={0.92}
                onPress={() => router.push(`/product/${product.id}?restaurantId=${restaurantId}`)}
                className="w-[47%] bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/15"
                style={cardShadow}
              >
                <View className="h-36 relative">
                  <RemoteImage uri={product.imageURL} className="w-full h-full" fallbackIcon="restaurant" />
                  <TouchableOpacity
                    onPress={() => toggleFavoriteProduct(restaurantId, product.id)}
                    className="absolute top-2 right-2 bg-white/90 w-8 h-8 rounded-full items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel={`${t('a11y.favoriteRemove')}: ${product.name}`}
                  >
                    <Icon name="favorite" color={palette.error} size={18} />
                  </TouchableOpacity>
                  {typeof product.rating === 'number' && product.rating > 0 && (
                    <View className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                      <Icon name="star" color={palette.star} size={13} />
                      <Text className="text-[11px] font-bold text-on-surface">{product.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
                <View className="p-3">
                  <Text className="text-base font-bold text-on-surface" numberOfLines={1}>
                    {product.name}
                  </Text>
                  {!!restaurantNames[restaurantId] && (
                    <Text className="text-xs text-on-surface-variant mt-0.5" numberOfLines={1}>
                      {restaurantNames[restaurantId]}
                    </Text>
                  )}
                  <View className="flex-row items-center justify-between mt-2">
                    <Text className="text-lg font-bold text-primary">${product.price.toFixed(2)}</Text>
                    <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
                      <Icon name="arrow-forward" color="#ffffff" size={18} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
