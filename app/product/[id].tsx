import { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useProduct } from '@/hooks/useProduct';
import { useCart } from '@/hooks/useCart';
import { cartLineId } from '@/store/cartStore';
import { useFavorites } from '@/hooks/useFavorites';
import { useTranslation } from '@/hooks/useTranslation';
import { ProductReviewsSection } from '@/components/product/ProductReviewsSection';

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 4 },
};

export default function ProductScreen() {
  const { id, restaurantId } = useLocalSearchParams<{ id: string; restaurantId: string }>();
  const router = useRouter();
  const { product, restaurant, loading } = useProduct(restaurantId, id);
  const { addItem } = useCart();
  const { isFavoriteProduct, toggleFavoriteProduct } = useFavorites();
  const { t } = useTranslation();

  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  // Offsets dentro del ScrollView para desplazar el campo de notas a la vista.
  // Usamos onLayout en vez de measureLayout: en la Nueva Arquitectura (Fabric)
  // measureLayout exige una ref a componente nativo, no un findNodeHandle.
  const contentTopRef = useRef(0);
  const notesTopRef = useRef(0);

  // Al enfocar las instrucciones, desplaza ese campo arriba del teclado.
  const scrollToNotes = () => {
    setTimeout(() => {
      const y = contentTopRef.current + notesTopRef.current - 24;
      scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
    }, 150);
  };

  const toggleTopping = (name: string) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );

  const total = useMemo(() => {
    if (!product) return 0;
    const toppingsTotal = (product.toppings ?? [])
      .filter((t) => selected.includes(t.name))
      .reduce((sum, t) => sum + t.price, 0);
    return (product.price + toppingsTotal) * quantity;
  }, [product, selected, quantity]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={palette.primary} />
      </SafeAreaView>
    );
  }

  if (!product || !restaurant) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <ScreenHeader showBack showNotifications={false} />
        <View className="flex-1 items-center justify-center gap-2 px-6">
          <Icon name="error-outline" size={40} color={palette.outline} />
          <Text className="text-on-surface-variant text-center">{t('product.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAdd = () => {
    const chosenToppings = (product.toppings ?? [])
      .filter((t) => selected.includes(t.name))
      .map((t) => ({ name: t.name, price: t.price }));
    const trimmedNotes = notes.trim();
    addItem(
      {
        id: cartLineId(product.id, chosenToppings, trimmedNotes),
        productId: product.id,
        name: product.name,
        price: total / quantity,
        quantity,
        toppings: chosenToppings,
        imageURL: product.imageURL,
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      },
      restaurant.id
    );
    router.push('/cart');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        showBack
        showSearch={false}
        showFavorite
        favoriteActive={isFavoriteProduct(restaurant.id, product.id)}
        onFavorite={() => toggleFavoriteProduct(restaurant.id, product.id)}
        showShare
        showNotifications={false}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View className="h-[397px] relative">
          {!!product.imageURL && (
            <Image source={{ uri: product.imageURL }} className="w-full h-full" resizeMode="cover" />
          )}
          <View className="absolute bottom-4 right-4 bg-white/90 px-3 py-1 rounded-full flex-row items-center gap-1" style={cardShadow}>
            <Icon name="star" color={palette.star} size={18} />
            <Text className="text-sm font-bold text-on-surface">
              {restaurant.rating.toFixed(1)} ({restaurant.reviewCount}+)
            </Text>
          </View>
        </View>

        <View
          className="px-4 py-6"
          onLayout={(e) => {
            contentTopRef.current = e.nativeEvent.layout.y;
          }}
        >
          {/* Title + price */}
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-bold text-on-background flex-1 pr-3">{product.name}</Text>
            <Text className="text-xl font-bold text-primary">${product.price.toFixed(2)}</Text>
          </View>

          {/* Tags */}
          {product.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {product.tags.map((tag) => (
                <View key={tag} className="bg-secondary-container px-3 py-1 rounded-full">
                  <Text className="text-on-secondary-container text-xs font-medium">{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          <Text className="text-on-surface-variant text-base leading-relaxed mb-6">
            {product.description}
          </Text>

          {/* Quantity + delivery */}
          <View className="flex-row items-center gap-6 mb-8">
            <View className="bg-surface-container-high rounded-full px-4 py-3 flex-row items-center gap-6">
              <TouchableOpacity
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                accessibilityRole="button"
                accessibilityLabel={t('a11y.decrease')}
              >
                <Icon name="remove" color={palette.primary} />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-on-surface w-4 text-center">{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity((q) => q + 1)}
                accessibilityRole="button"
                accessibilityLabel={t('a11y.increase')}
              >
                <Icon name="add" color={palette.primary} />
              </TouchableOpacity>
            </View>
            <View>
              <Text className="text-xs text-on-surface-variant">{t('product.estimatedDelivery')}</Text>
              <Text className="text-sm font-bold text-on-surface">{restaurant.deliveryTime}</Text>
            </View>
          </View>

          {/* Customize */}
          {product.toppings.length > 0 && (
            <View className="mb-8">
              <Text className="text-sm font-bold uppercase tracking-wider text-secondary mb-4">
                {t('product.customize')}
              </Text>
              <View className="gap-2">
                {product.toppings.map((topping) => {
                  const isOn = selected.includes(topping.name);
                  return (
                    <TouchableOpacity
                      key={topping.name}
                      onPress={() => toggleTopping(topping.name)}
                      className={`flex-row items-center justify-between p-4 bg-surface-container-lowest rounded-xl border-2 ${
                        isOn ? 'border-primary' : 'border-transparent'
                      }`}
                      style={cardShadow}
                    >
                      <View className="flex-row items-center gap-4">
                        <Icon
                          name={isOn ? 'check-circle' : 'radio-button-unchecked'}
                          color={isOn ? palette.primary : palette.outline}
                        />
                        <Text className="text-base text-on-surface">{topping.name}</Text>
                      </View>
                      <Text className="text-primary text-sm font-bold">+${topping.price.toFixed(2)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Special Instructions */}
          <View
            onLayout={(e) => {
              notesTopRef.current = e.nativeEvent.layout.y;
            }}
          >
            <Text className="text-sm font-bold uppercase tracking-wider text-secondary mb-2">
              {t('product.specialInstructions')}
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              onFocus={scrollToNotes}
              placeholder={t('product.instructionsPlaceholder')}
              placeholderTextColor={palette.outline}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-surface-container rounded-xl p-4 text-base text-on-surface min-h-[88px]"
            />
          </View>

          {/* Reseñas del producto */}
          <ProductReviewsSection restaurantId={restaurant.id} productId={product.id} />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom action bar */}
      <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 w-full bg-background/95 border-t border-outline-variant/20">
        <View className="p-4">
          <TouchableOpacity
            onPress={handleAdd}
            activeOpacity={0.9}
            className="bg-primary h-14 rounded-full flex-row items-center justify-center gap-3"
            style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 30, shadowOffset: { width: 0, height: 8 } }}
          >
            <Icon name="shopping-basket" color="#ffffff" />
            <Text className="text-white font-bold text-lg">{t('product.addToCart', { price: total.toFixed(2) })}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}
