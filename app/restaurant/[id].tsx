import { useState } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, ActivityIndicator, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useCart } from '@/hooks/useCart';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { cartLineId } from '@/store/cartStore';
import { useFavorites } from '@/hooks/useFavorites';
import { useTranslation } from '@/hooks/useTranslation';
import { cuisineLabel } from '@/lib/i18n';
import { isRestaurantOpen, todayHoursLabel } from '@/lib/schedule';
import { Product } from '@/types/product.types';

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
};

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { restaurant, categories, products, loading } = useRestaurant(id);
  const { addItemGuarded, itemCount, total } = useCart();
  const { isFavorite, toggleFavorite, isFavoriteProduct, toggleFavoriteProduct } = useFavorites();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={palette.primary} />
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <ScreenHeader showBack tintPrimary />
        <View className="flex-1 items-center justify-center gap-2 px-6">
          <Icon name="error-outline" size={40} color={palette.outline} />
          <Text className="text-on-surface-variant text-center">{t('restaurant.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const open = isRestaurantOpen(restaurant);
  const favorite = isFavorite(restaurant.id);

  const query = search.trim().toLowerCase();
  const searching = query.length > 0;
  const selectedCategory = activeCategory ?? categories[0]?.id ?? null;
  const visibleProducts = searching
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      )
    : products.filter((p) => p.categoryId === selectedCategory);
  const [featured, ...rest] = visibleProducts;

  const add = (product: Product) => {
    // Si el restaurante está cerrado, no se puede pedir.
    if (!open) {
      Alert.alert(t('restaurant.closedTitle'), t('restaurant.closedMsg'));
      return;
    }
    void addItemGuarded(
      {
        id: cartLineId(product.id),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageURL: product.imageURL,
      },
      restaurant.id
    );
  };

  const goToProduct = (product: Product) =>
    router.push(`/product/${product.id}?restaurantId=${restaurant.id}`);

  const onShare = () =>
    Share.share({
      message: `Mira ${restaurant.name} en QuickBite — ${restaurant.cuisineTypes.join(', ')}`,
    });

  // Tarjeta destacada (primer plato de la lista mostrada).
  const FeaturedCard = ({ item }: { item: Product }) => {
    const liked = isFavoriteProduct(restaurant.id, item.id);
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => goToProduct(item)}
        className="bg-surface-container-lowest rounded-xl overflow-hidden"
        style={cardShadow}
      >
        <View className="h-48 relative">
          {!!item.imageURL && <Image source={{ uri: item.imageURL }} className="w-full h-full" resizeMode="cover" />}
          <TouchableOpacity
            onPress={() => toggleFavoriteProduct(restaurant.id, item.id)}
            className="absolute top-2 left-2 w-10 h-10 bg-white/90 rounded-full items-center justify-center"
          >
            <Icon name={liked ? 'favorite' : 'favorite-border'} color={liked ? palette.error : palette.onSurfaceVariant} size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => add(item)}
            className="absolute top-2 right-2 w-10 h-10 bg-primary rounded-full items-center justify-center"
            style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}
          >
            <Icon name="add" color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View className="p-4">
          <View className="flex-row justify-between items-start mb-1">
            <Text className="text-lg font-bold text-on-surface flex-1 pr-2">{item.name}</Text>
            <Text className="text-sm font-bold text-primary">${item.price.toFixed(2)}</Text>
          </View>
          <Text className="text-on-surface-variant text-sm" numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Fila compacta de plato (texto a la izquierda, imagen a la derecha).
  const MenuRow = ({ item }: { item: Product }) => {
    const liked = isFavoriteProduct(restaurant.id, item.id);
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => goToProduct(item)}
        className="bg-surface-container-lowest rounded-xl p-4 flex-row gap-4"
        style={cardShadow}
      >
        <View className="flex-1">
          <Text className="text-sm font-bold text-on-surface mb-1">{item.name}</Text>
          <Text className="text-on-surface-variant text-xs mb-4" numberOfLines={2}>
            {item.description}
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-primary">${item.price.toFixed(2)}</Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => toggleFavoriteProduct(restaurant.id, item.id)}
                className="w-8 h-8 rounded-full items-center justify-center"
              >
                <Icon name={liked ? 'favorite' : 'favorite-border'} color={liked ? palette.error : palette.onSurfaceVariant} size={18} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => add(item)}
                className="bg-primary-container/20 w-8 h-8 rounded-full items-center justify-center"
              >
                <Icon name="add" color={palette.primary} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {!!item.imageURL && (
          <Image source={{ uri: item.imageURL }} className="w-24 h-24 rounded-lg" resizeMode="cover" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        showBack
        showFavorite
        favoriteActive={favorite}
        onFavorite={() => toggleFavorite(restaurant.id)}
        showShare
        onShare={onShare}
        showNotifications={false}
        tintPrimary
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View className="h-[353px] relative">
          <RemoteImage uri={restaurant.coverImage} className="w-full h-full" fallbackIcon="restaurant" fallbackIconSize={48} />
          <View className="absolute inset-x-0 top-0 h-24 bg-black/30" />
          <View className="absolute inset-x-0 bottom-0 h-40 bg-black/50" />
          <View className="absolute bottom-0 left-0 w-full p-6">
            <View
              className="self-start px-3 py-1 rounded-full mb-2"
              style={{ backgroundColor: open ? palette.primary : palette.error }}
            >
              <Text className="text-white text-xs font-semibold">
                {open ? t('restaurant.openNow') : t('restaurant.closed')}
              </Text>
            </View>
            <Text className="text-white text-2xl font-bold mb-1">{restaurant.name}</Text>
            <Text className="text-white/90 text-base">{restaurant.cuisineTypes.map((c) => cuisineLabel(t, c)).join(' • ')}</Text>
          </View>
        </View>

        {/* Info card (superpuesta) */}
        <View className="mx-4 -mt-4 bg-surface-container-lowest rounded-xl p-4 flex-row" style={cardShadow}>
          <View className="flex-1 items-center gap-1">
            <View className="flex-row items-center gap-1">
              <Icon name="star" color={palette.primary} size={18} />
              <Text className="text-sm font-bold text-primary">{restaurant.rating.toFixed(1)}</Text>
            </View>
            <Text className="text-on-surface-variant text-xs text-center">
              {t('restaurant.ratings', { n: restaurant.reviewCount })}
            </Text>
          </View>
          <View className="flex-1 items-center gap-1 border-x border-outline-variant">
            <View className="flex-row items-center gap-1">
              <Icon name="schedule" color={palette.secondary} size={18} />
              <Text className="text-sm font-bold text-on-surface">{restaurant.deliveryTime}</Text>
            </View>
            <Text className="text-on-surface-variant text-xs text-center">{t('restaurant.deliveryTime')}</Text>
          </View>
          <View className="flex-1 items-center gap-1">
            <View className="flex-row items-center gap-1">
              <Icon name="local-shipping" color={palette.tertiary} size={18} />
              <Text className="text-sm font-bold text-tertiary">
                {restaurant.deliveryFee === 0 ? t('common.free') : `$${restaurant.deliveryFee.toFixed(2)}`}
              </Text>
            </View>
            <Text className="text-on-surface-variant text-xs text-center">{t('restaurant.fee')}</Text>
          </View>
        </View>

        {/* Aviso de restaurante cerrado (no se puede pedir) */}
        {!open && (
          <View className="mx-4 mt-3 flex-row items-center gap-3 bg-error/10 border border-error/30 rounded-xl p-4">
            <Icon name="lock" color={palette.error} size={22} />
            <View className="flex-1">
              <Text className="text-error font-bold text-sm">{t('restaurant.closedTitle')}</Text>
              <Text className="text-on-surface-variant text-xs mt-0.5">
                {t('restaurant.closedMsg')}
              </Text>
            </View>
          </View>
        )}

        {/* Horario / pedido mínimo / dirección */}
        <View className="mx-4 mt-3 gap-1">
          <View className="flex-row items-center gap-2">
            <Icon name="schedule" color={palette.secondary} size={16} />
            <Text className="text-sm text-on-surface-variant">
              {t('restaurant.today', { hours: todayHoursLabel(restaurant.schedule) })}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Icon name="shopping-basket" color={palette.secondary} size={16} />
            <Text className="text-sm text-on-surface-variant">
              {t('restaurant.minOrder', { amount: restaurant.minOrder.toFixed(2) })}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Icon name="location-on" color={palette.secondary} size={16} />
            <Text className="text-sm text-on-surface-variant flex-1" numberOfLines={1}>
              {restaurant.address}
            </Text>
          </View>
        </View>

        {/* Buscador del menú */}
        <View className="px-4 mt-4">
          <View className="relative justify-center">
            <View className="absolute left-3 z-10">
              <Icon name="search" color={palette.outline} size={20} />
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('restaurant.searchMenu')}
              placeholderTextColor={palette.outline}
              className="h-12 pl-11 pr-10 bg-surface-container-low rounded-xl text-base text-on-surface"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} className="absolute right-3 z-10">
                <Icon name="close" color={palette.onSurfaceVariant} size={20} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category tabs (ocultas al buscar) */}
        {!searching && categories.length > 0 && (
          <View className="mt-4 border-b border-outline-variant/30">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-4 py-2 gap-3 items-center"
            >
              {categories.map((cat) => {
                const isActive = cat.id === selectedCategory;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-full ${isActive ? 'bg-primary-container' : ''}`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isActive ? 'text-on-primary-container' : 'text-secondary'
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Productos */}
        <View className="px-4 mt-6">
          {visibleProducts.length === 0 ? (
            <View className="py-12 items-center gap-2">
              <Icon name={searching ? 'search-off' : 'restaurant-menu'} size={40} color={palette.outline} />
              <Text className="text-on-surface-variant text-center">
                {searching ? t('restaurant.noSearch') : t('restaurant.noProducts')}
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {featured && (searching ? <MenuRow item={featured} /> : <FeaturedCard item={featured} />)}
              {rest.map((item) => (
                <MenuRow key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating cart (visible solo con ítems en el carrito) */}
      {itemCount > 0 && (
        <SafeAreaView edges={['bottom']} className="absolute bottom-0 right-0">
          <TouchableOpacity
            onPress={() => router.push('/cart')}
            className="m-4 bg-primary flex-row items-center gap-3 pl-4 pr-6 py-3 rounded-full"
            style={{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}
          >
            <View className="relative">
              <Icon name="shopping-bag" color="#ffffff" />
              <View className="absolute -top-1 -right-1 bg-tertiary w-4 h-4 rounded-full items-center justify-center border-2 border-primary">
                <Text className="text-white text-[10px] font-bold">{itemCount}</Text>
              </View>
            </View>
            <View>
              <Text className="text-white/80 text-[10px]">{t('restaurant.viewCart')}</Text>
              <Text className="text-white font-bold">${total.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
}
