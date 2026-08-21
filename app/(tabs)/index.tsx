import { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, IconName } from '@/components/ui/Icon';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DeliveryAddressSheet } from '@/components/address/DeliveryAddressSheet';
import { palette } from '@/constants/colors';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/hooks/useOffers';
import { useCart } from '@/hooks/useCart';
import { useTranslation } from '@/hooks/useTranslation';
import { useAllProducts } from '@/hooks/useAllProducts';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { cuisineLabel } from '@/lib/i18n';

const categories: { label: string; icon: IconName }[] = [
  { label: 'Pizza', icon: 'local-pizza' },
  { label: 'Burgers', icon: 'lunch-dining' },
  { label: 'Sushi', icon: 'set-meal' },
  { label: 'Asian', icon: 'ramen-dining' },
  { label: 'Italian', icon: 'dinner-dining' },
  { label: 'American', icon: 'fastfood' },
];

// 'default' = sin ordenar por el usuario (respeta el orden neutral del servicio,
// alfabético). 'rating'/'fee' son opt-in desde el sheet de filtros.
type SortBy = 'default' | 'rating' | 'fee';

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 4 },
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { restaurants, loading } = useRestaurants();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { offers } = useOffers();
  const { setPendingCoupon } = useCart();
  const { t, lang } = useTranslation();

  const firstName = user?.name?.split(' ')[0] ?? t('profile.guest');
  const restaurantName = (id: string) =>
    restaurants.find((r) => r.id === id)?.name;

  const [addressSheetVisible, setAddressSheetVisible] = useState(false);
  const defaultAddress =
    user?.addresses?.find((a) => a.isDefault) ?? user?.addresses?.[0] ?? null;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('default');

  const filtersActive =
    freeDeliveryOnly || topRatedOnly || sortBy !== 'default';
  const searchActive = !!search.trim();
  const anyActive = filtersActive || !!activeCategory || searchActive;

  // Platillos de todos los restaurantes (carga perezosa, solo al buscar).
  const allProducts = useAllProducts(
    restaurants.map((r) => r.id),
    searchActive
  );

  const filtered = useMemo(() => {
    let result = restaurants;

    if (activeCategory) {
      const c = activeCategory.toLowerCase();
      result = result.filter((r) =>
        r.cuisineTypes.some((t) => t.toLowerCase().includes(c))
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      // Restaurantes que tienen un platillo que coincide (por nombre o descripción).
      const restIdsWithDish = new Set(
        allProducts
          .filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q)
          )
          .map((p) => p.restaurantId)
      );
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          // Coincide contra la cocina en inglés (dato) y su traducción visible.
          r.cuisineTypes.some(
            (ct) =>
              ct.toLowerCase().includes(q) ||
              cuisineLabel(t, ct).toLowerCase().includes(q)
          ) ||
          restIdsWithDish.has(r.id)
      );
    }

    if (freeDeliveryOnly) result = result.filter((r) => r.deliveryFee === 0);
    if (topRatedOnly) result = result.filter((r) => r.rating >= 4.5);

    // Solo se reordena si el usuario eligió un criterio. En 'default' se respeta
    // el orden neutral del servicio (alfabético) para no enterrar a los nuevos.
    if (sortBy === 'fee') {
      result = [...result].sort((a, b) => a.deliveryFee - b.deliveryFee);
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => b.rating - a.rating);
    }

    return result;
    // `lang` en deps: la búsqueda de cocina usa la traducción visible (cuisineLabel).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants, activeCategory, search, allProducts, freeDeliveryOnly, topRatedOnly, sortBy, lang]);

  // Platillos que coinciden con el texto buscado (para listarlos directamente).
  const matchingDishes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return allProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }, [search, allProducts]);

  const clearAll = () => {
    setSearch('');
    setActiveCategory(null);
    setFreeDeliveryOnly(false);
    setTopRatedOnly(false);
    setSortBy('default');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* TopAppBar */}
      <View className="flex-row justify-between items-center px-4 py-2 bg-background">
        <Text className="text-xl font-bold text-primary tracking-tight">QuickBite</Text>
        <TouchableOpacity
          onPress={() => setAddressSheetVisible(true)}
          activeOpacity={0.7}
          className="flex-row items-center gap-1"
        >
          <Icon name="location-on" color={palette.primary} />
          <View>
            <Text className="text-xs text-on-surface-variant">{t('home.deliverTo')}</Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-sm font-bold text-on-surface" numberOfLines={1}>
                {defaultAddress ? defaultAddress.label : t('home.selectAddress')}
              </Text>
              <Icon name="keyboard-arrow-down" color={palette.onSurface} size={18} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pt-4 pb-8 gap-6"
        keyboardShouldPersistTaps="handled"
      >
        {/* Greeting & Search */}
        <View className="gap-4">
          <View>
            <Text className="text-2xl font-bold text-on-background">{t('home.greeting', { name: firstName })}</Text>
            <Text className="text-base text-on-surface-variant">{t('home.craving')}</Text>
          </View>
          <View className="relative justify-center">
            <View className="absolute left-4 z-10">
              <Icon name="search" color={palette.outline} size={22} />
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('home.search')}
              placeholderTextColor={palette.outline}
              returnKeyType="search"
              className="h-14 pl-12 pr-12 bg-surface-container-low rounded-xl text-base text-on-surface"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} className="absolute right-4 z-10">
                <Icon name="close" color={palette.onSurfaceVariant} size={22} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Ofertas (desde la base de datos) */}
        {offers.length > 0 && (
          <View className="gap-4">
            <Text className="text-xl font-bold text-on-surface">{t('home.offers')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-4"
              contentContainerClassName="px-4 gap-4"
            >
              {offers.map((offer) => {
                const restName = restaurantName(offer.restaurantId);
                return (
                  <TouchableOpacity
                    key={offer.id}
                    activeOpacity={0.9}
                    onPress={() =>
                      // Oferta de platillo → abre el platillo; si no, el restaurante.
                      offer.type === 'dish' && offer.productId
                        ? router.push(`/product/${offer.productId}?restaurantId=${offer.restaurantId}`)
                        : router.push(`/restaurant/${offer.restaurantId}`)
                    }
                    className="w-72 h-44 rounded-2xl overflow-hidden"
                    style={cardShadow}
                  >
                    <RemoteImage uri={offer.image} className="w-full h-full" fallbackIcon="local-offer" />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.8)', 'transparent']}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0.3 }}
                      style={{ position: 'absolute', inset: 0 }}
                    />
                    <View className="absolute inset-0 p-4 justify-between">
                      <View className="bg-primary self-start px-2 py-1 rounded-full">
                        <Text className="text-on-primary text-[10px] font-bold">{offer.badge}</Text>
                      </View>
                      <View className="gap-0.5">
                        <Text className="text-white text-lg font-bold" numberOfLines={1}>{offer.title}</Text>
                        <Text className="text-white/85 text-xs" numberOfLines={1}>{offer.description}</Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          {!!restName && (
                            <Text className="text-white/90 text-xs font-semibold" numberOfLines={1}>{restName}</Text>
                          )}
                          {!!offer.couponCode && (
                            <TouchableOpacity
                              onPress={() => {
                                setPendingCoupon(offer.couponCode!);
                                router.push('/cart');
                              }}
                              className="bg-white/25 px-2 py-0.5 rounded-full flex-row items-center gap-1"
                            >
                              <Icon name="confirmation-number" color="#ffffff" size={12} />
                              <Text className="text-white text-[10px] font-bold">{t('home.useCoupon', { code: offer.couponCode })}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Categories */}
        <View className="gap-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-bold text-on-surface">{t('home.categories')}</Text>
            {activeCategory && (
              <TouchableOpacity onPress={() => setActiveCategory(null)}>
                <Text className="text-primary text-sm font-bold">{t('common.seeAll')}</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-4 pb-1"
          >
            {categories.map((category) => {
              const active = activeCategory === category.label;
              return (
                <TouchableOpacity
                  key={category.label}
                  onPress={() => setActiveCategory(active ? null : category.label)}
                  activeOpacity={0.8}
                  className="items-center gap-1"
                >
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center"
                    style={{ backgroundColor: active ? palette.primary : palette.secondaryContainer }}
                  >
                    <Icon name={category.icon} color={active ? '#ffffff' : palette.primary} size={30} />
                  </View>
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: active ? palette.primary : palette.onSurface }}
                  >
                    {cuisineLabel(t, category.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Platillos que coinciden (listados directo, con link al platillo) */}
        {searchActive && matchingDishes.length > 0 && (
          <View className="gap-4">
            <Text className="text-xl font-bold text-on-surface">
              {t('home.dishes', { n: matchingDishes.length })}
            </Text>
            <View className="gap-3">
              {matchingDishes.map((p) => (
                <TouchableOpacity
                  key={`${p.restaurantId}-${p.productId}`}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/product/${p.productId}?restaurantId=${p.restaurantId}`)}
                  className="bg-surface-container-lowest rounded-xl p-3 flex-row items-center gap-3"
                  style={cardShadow}
                >
                  {p.imageURL ? (
                    <Image source={{ uri: p.imageURL }} className="w-16 h-16 rounded-lg" resizeMode="cover" />
                  ) : (
                    <View className="w-16 h-16 rounded-lg bg-surface-container items-center justify-center">
                      <Icon name="restaurant" color={palette.outline} />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-base font-bold text-on-surface" numberOfLines={1}>{p.name}</Text>
                    <Text className="text-xs text-on-surface-variant" numberOfLines={1}>{restaurantName(p.restaurantId)}</Text>
                    <Text className="text-sm font-bold text-primary mt-1">${p.price.toFixed(2)}</Text>
                  </View>
                  <Icon name="chevron-right" color={palette.outline} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Restaurants */}
        <View className="gap-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-bold text-on-surface">
              {anyActive ? t('home.results', { n: filtered.length }) : t('home.recommended')}
            </Text>
            <TouchableOpacity
              onPress={() => setFiltersVisible(true)}
              className="flex-row items-center gap-1"
            >
              <Icon name="tune" color={palette.primary} size={18} />
              <Text className="text-primary text-sm font-bold">{t('home.filters')}</Text>
              {filtersActive && <View className="w-2 h-2 rounded-full bg-primary" />}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : filtered.length === 0 ? (
            <View className="py-12 items-center gap-3">
              <Icon name="search-off" size={40} color={palette.outline} />
              <Text className="text-on-surface-variant text-center">
                {restaurants.length === 0
                  ? t('home.noRestaurants')
                  : t('home.noResults')}
              </Text>
              {anyActive && restaurants.length > 0 && (
                <TouchableOpacity
                  onPress={clearAll}
                  className="bg-primary-container px-6 py-2 rounded-full"
                >
                  <Text className="text-on-primary-container font-bold text-sm">{t('home.clearFilters')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View className="gap-6">
              {filtered.map((r) => {
                const freeDelivery = r.deliveryFee === 0;
                const liked = isFavorite(r.id);
                return (
                  <TouchableOpacity
                    key={r.id}
                    activeOpacity={0.95}
                    onPress={() => router.push(`/restaurant/${r.id}`)}
                    className="bg-surface-container-lowest rounded-2xl overflow-hidden"
                    style={cardShadow}
                  >
                    <View className="h-48 relative">
                      <RemoteImage uri={r.coverImage} className="w-full h-full" fallbackIcon="restaurant" fallbackIconSize={40} />
                      {freeDelivery && (
                        <View className="absolute top-3 left-3 bg-primary-container px-2 py-1 rounded-lg">
                          <Text className="text-on-primary-container text-sm font-semibold">{t('home.freeDelivery')}</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => toggleFavorite(r.id)}
                        className="absolute top-3 right-3 w-10 h-10 bg-white/90 rounded-full items-center justify-center"
                        accessibilityRole="button"
                        accessibilityLabel={`${t(liked ? 'a11y.favoriteRemove' : 'a11y.favoriteAdd')}: ${r.name}`}
                      >
                        <Icon
                          name={liked ? 'favorite' : 'favorite-border'}
                          size={20}
                          color={liked ? palette.primary : palette.onSurfaceVariant}
                        />
                      </TouchableOpacity>
                    </View>

                    <View className="p-4 gap-2">
                      <View className="flex-row justify-between items-start">
                        <Text className="text-xl font-bold text-on-surface flex-1 pr-2">{r.name}</Text>
                        <View className="flex-row items-center gap-1">
                          <Icon name="star" size={16} color={palette.star} />
                          <Text className="text-sm font-bold text-on-surface">{r.rating.toFixed(1)}</Text>
                        </View>
                      </View>
                      <Text className="text-base text-on-surface-variant">{r.cuisineTypes.map((c) => cuisineLabel(t, c)).join(' • ')}</Text>
                      <View className="flex-row items-center gap-4">
                        <View className="flex-row items-center gap-1">
                          <Icon name="schedule" size={14} color={palette.secondary} />
                          <Text className="text-secondary text-xs">{r.deliveryTime}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Icon name="payments" size={14} color={palette.secondary} />
                          <Text className="text-secondary text-xs">
                            {freeDelivery ? t('home.freeDelivery') : t('home.deliveryFee', { fee: r.deliveryFee.toFixed(2) })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Filters bottom sheet */}
      <BottomSheet visible={filtersVisible} onClose={() => setFiltersVisible(false)}>
        <View className="gap-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-on-surface">{t('home.filters')}</Text>
            <TouchableOpacity onPress={() => setFiltersVisible(false)}>
              <Icon name="close" color={palette.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Ordenar por */}
          <View className="gap-2">
            <Text className="text-sm font-bold text-on-surface-variant">{t('home.sortBy')}</Text>
            <View className="flex-row gap-2">
              {([
                { key: 'rating', label: t('home.topRated') },
                { key: 'fee', label: t('home.cheapestDelivery') },
              ] as { key: SortBy; label: string }[]).map((opt) => {
                const on = sortBy === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setSortBy(opt.key)}
                    className="px-4 py-2 rounded-full"
                    style={{ backgroundColor: on ? palette.primary : palette.surfaceContainer }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: on ? palette.onPrimary : palette.onSurfaceVariant }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Toggles */}
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-on-surface">{t('home.onlyFreeDelivery')}</Text>
            <Switch
              value={freeDeliveryOnly}
              onValueChange={setFreeDeliveryOnly}
              trackColor={{ true: palette.primary, false: palette.outlineVariant }}
              thumbColor="#ffffff"
            />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-on-surface">{t('home.only45')}</Text>
            <Switch
              value={topRatedOnly}
              onValueChange={setTopRatedOnly}
              trackColor={{ true: palette.primary, false: palette.outlineVariant }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Acciones */}
          <View className="flex-row gap-3 pt-2">
            <TouchableOpacity
              onPress={clearAll}
              className="flex-1 h-12 rounded-full border border-outline-variant items-center justify-center"
            >
              <Text className="text-on-surface font-bold">{t('common.clear')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFiltersVisible(false)}
              className="flex-1 h-12 rounded-full bg-primary items-center justify-center"
            >
              <Text className="text-on-primary font-bold">
                {t('home.seeResults', { n: filtered.length })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

      {/* Selector de dirección de entrega */}
      <DeliveryAddressSheet
        visible={addressSheetVisible}
        onClose={() => setAddressSheetVisible(false)}
      />
    </SafeAreaView>
  );
}
