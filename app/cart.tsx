import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { restaurantsService } from '@/services/restaurants.service';
import { couponsService, couponDiscount } from '@/services/coupons.service';
import { DeliveryAddressSheet } from '@/components/address/DeliveryAddressSheet';
import { Restaurant } from '@/types/restaurant.types';

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 4 },
};

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const {
    items,
    restaurantId,
    coupon,
    pendingCouponCode,
    incrementItem,
    decrementItem,
    removeItem,
    setCoupon,
    setPendingCoupon,
    total: subtotal,
  } = useCart();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [addressSheetVisible, setAddressSheetVisible] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    restaurantsService.getById(restaurantId).then(setRestaurant);
  }, [restaurantId]);

  // Cupón sugerido por una oferta: se auto-aplica al haber productos.
  useEffect(() => {
    if (!pendingCouponCode || coupon || items.length === 0) return;
    const codeToApply = pendingCouponCode;
    setPendingCoupon(null); // consumir
    setCode(codeToApply);
    (async () => {
      setApplying(true);
      setCouponError(null);
      try {
        const result = await couponsService.validate(codeToApply, subtotal);
        if (result.valid) {
          setCoupon(result.coupon);
          setCode('');
        } else {
          setCouponError(t(`coupon.${result.reason}`, { amount: (result.coupon?.minOrder ?? 0).toFixed(2) }));
        }
      } finally {
        setApplying(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCouponCode, coupon, items.length, subtotal]);

  const deliveryFee = restaurant?.deliveryFee ?? 0;
  const minOrder = restaurant?.minOrder ?? 0;
  // El cupón solo aplica si el subtotal sigue cumpliendo su mínimo.
  const discount =
    coupon && subtotal >= coupon.minOrder ? couponDiscount(coupon, subtotal) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  const belowMinimum = subtotal < minOrder;

  const defaultAddress =
    user?.addresses?.find((a) => a.isDefault) ?? user?.addresses?.[0] ?? null;

  const applyCoupon = async () => {
    if (applying || !code.trim()) return;
    setApplying(true);
    setCouponError(null);
    try {
      const result = await couponsService.validate(code, subtotal);
      if (result.valid) {
        setCoupon(result.coupon);
        setCode('');
      } else {
        setCoupon(null);
        setCouponError(t(`coupon.${result.reason}`, { amount: (result.coupon?.minOrder ?? 0).toFixed(2) }));
      }
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError(null);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <ScreenHeader showBack showSearch showNotifications={false} />
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Icon name="shopping-bag" size={56} color="#bccbb9" />
          <Text className="text-lg font-bold text-on-surface">{t('cart.empty')}</Text>
          <Text className="text-secondary text-center">{t('cart.emptyDesc')}</Text>
          {!!pendingCouponCode && (
            <View className="flex-row items-center gap-2 bg-primary-container/20 px-4 py-2 rounded-full">
              <Icon name="confirmation-number" color={palette.primary} size={18} />
              <Text className="text-on-surface text-sm">
                {t('cart.pendingCoupon', { code: pendingCouponCode ?? '' })}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            className="bg-primary px-8 h-12 rounded-full items-center justify-center mt-2"
          >
            <Text className="text-white font-bold">{t('cart.browse')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader showBack showSearch showNotifications={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pt-6 pb-32 gap-6"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* Your Order */}
        <View className="gap-4">
          <Text className="text-2xl font-bold text-on-background">{t('cart.yourOrder')}</Text>
          <View className="gap-4">
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.95}
                onPress={() =>
                  restaurantId &&
                  router.push(
                    `/product/${item.productId}?restaurantId=${restaurantId}&editLineId=${encodeURIComponent(item.id)}`
                  )
                }
                className="bg-surface-container-lowest rounded-xl p-4 flex-row gap-4 items-center"
                style={cardShadow}
              >
                {item.imageURL ? (
                  <Image source={{ uri: item.imageURL }} className="w-20 h-20 rounded-lg" resizeMode="cover" />
                ) : (
                  <View className="w-20 h-20 rounded-lg bg-surface-container items-center justify-center">
                    <Icon name="restaurant" color={palette.outline} />
                  </View>
                )}
                <View className="flex-1">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-lg font-bold text-on-surface flex-1 pr-2">{item.name}</Text>
                    <TouchableOpacity
                      onPress={() => removeItem(item.id)}
                      className="p-1"
                      accessibilityRole="button"
                      accessibilityLabel={`${t('a11y.removeItem')}: ${item.name}`}
                    >
                      <Icon name="delete" color={palette.error} size={22} />
                    </TouchableOpacity>
                  </View>
                  {item.toppings && item.toppings.length > 0 && (
                    <Text className="text-on-surface-variant text-sm" numberOfLines={1}>
                      {item.toppings.map((t) => t.name).join(', ')}
                    </Text>
                  )}
                  {!!item.notes && (
                    <Text className="text-on-surface-variant text-xs italic mt-0.5" numberOfLines={2}>
                      {t('cart.note')}: {item.notes}
                    </Text>
                  )}
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-lg font-bold text-primary">${item.price.toFixed(2)}</Text>
                    <View className="flex-row items-center bg-surface-container px-2 py-1 rounded-full gap-2">
                      <TouchableOpacity
                        onPress={() => decrementItem(item.id)}
                        className="px-1"
                        accessibilityRole="button"
                        accessibilityLabel={t('a11y.decrease')}
                      >
                        <Icon name="remove" color={palette.onSurface} size={18} />
                      </TouchableOpacity>
                      <Text className="text-sm font-bold text-on-surface px-1">{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => incrementItem(item.id)}
                        className="px-1"
                        accessibilityRole="button"
                        accessibilityLabel={t('a11y.increase')}
                      >
                        <Icon name="add" color={palette.onSurface} size={18} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Delivery Address */}
        <View className="bg-surface-container-lowest rounded-xl p-4" style={cardShadow}>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-bold uppercase tracking-wider text-secondary">{t('cart.deliveryAddress')}</Text>
            <TouchableOpacity onPress={() => setAddressSheetVisible(true)}>
              <Text className="text-primary text-sm font-bold">{t('common.change')}</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="bg-primary-container p-2 rounded-full">
              <Icon name="location-on" color={palette.onPrimaryContainer} />
            </View>
            {defaultAddress ? (
              <View className="flex-1">
                <Text className="text-base text-on-background">{defaultAddress.street}</Text>
                <Text className="text-xs text-on-surface-variant">{defaultAddress.city}</Text>
              </View>
            ) : (
              <Text className="text-base text-on-surface-variant flex-1">{t('cart.addAddress')}</Text>
            )}
          </View>
        </View>

        {/* Coupon Code */}
        <View className="bg-surface-container-lowest rounded-xl p-4" style={cardShadow}>
          <Text className="text-sm font-bold uppercase tracking-wider text-secondary mb-2">{t('cart.couponCode')}</Text>
          {coupon ? (
            <View className="flex-row items-center justify-between bg-primary-container/20 rounded-xl px-4 py-3">
              <View className="flex-row items-center gap-2 flex-1 pr-2">
                <Icon name="confirmation-number" color={palette.primary} size={22} />
                <Text className="text-on-surface font-bold">{coupon.code}</Text>
                {discount > 0 ? (
                  <Text className="text-tertiary font-semibold">-${discount.toFixed(2)}</Text>
                ) : (
                  <Text className="text-error text-xs flex-1" numberOfLines={2}>
                    {t('coupon.min_order', { amount: coupon.minOrder.toFixed(2) })}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={removeCoupon} className="p-1">
                <Icon name="close" color={palette.onSurfaceVariant} size={20} />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-2">
              <View className="flex-1 relative justify-center">
                <View className="absolute left-3 z-10">
                  <Icon name="confirmation-number" color={palette.onSurfaceVariant} size={22} />
                </View>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="characters"
                  placeholder={t('cart.enterCode')}
                  placeholderTextColor={palette.onSurfaceVariant}
                  className="bg-surface-container-low rounded-xl pl-11 pr-4 py-3 text-base text-on-surface"
                />
              </View>
              <TouchableOpacity
                onPress={applyCoupon}
                disabled={applying}
                className="bg-primary px-6 rounded-xl items-center justify-center"
                style={applying ? { opacity: 0.6 } : undefined}
              >
                {applying ? (
                  <ActivityIndicator color={palette.onPrimary} />
                ) : (
                  <Text className="text-on-primary text-sm font-bold">{t('common.apply')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          {couponError && <Text className="text-error text-sm mt-2">{couponError}</Text>}
        </View>

        {/* Payment Summary */}
        <View className="bg-surface-container-lowest rounded-xl p-4 gap-2" style={cardShadow}>
          <Text className="text-sm font-bold uppercase tracking-wider text-secondary mb-1">
            {t('cart.paymentSummary')}
          </Text>
          <View className="flex-row justify-between">
            <Text className="text-base text-on-surface-variant">{t('cart.subtotal')}</Text>
            <Text className="text-base text-on-background">${subtotal.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-base text-on-surface-variant">{t('cart.deliveryFee')}</Text>
            <Text className="text-base text-on-background">
              {deliveryFee === 0 ? t('common.free') : `$${deliveryFee.toFixed(2)}`}
            </Text>
          </View>
          {discount > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-base text-on-surface-variant">{t('cart.discount')}</Text>
              <Text className="text-base text-tertiary">-${discount.toFixed(2)}</Text>
            </View>
          )}
          <View className="border-t border-outline-variant my-2 pt-2 flex-row justify-between items-center">
            <Text className="text-xl font-bold text-on-background">{t('cart.total')}</Text>
            <Text className="text-2xl font-extrabold text-primary">${total.toFixed(2)}</Text>
          </View>
        </View>

        {belowMinimum && (
          <Text className="text-error text-sm text-center">
            {t('cart.belowMin', { amount: minOrder.toFixed(2) })}
          </Text>
        )}
      </ScrollView>

      {/* Sticky footer */}
      <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 w-full bg-surface-container-lowest" style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 30, shadowOffset: { width: 0, height: -8 } }}>
        <View className="p-4">
          <TouchableOpacity
            onPress={() => router.push('/checkout')}
            disabled={belowMinimum}
            activeOpacity={0.9}
            className="h-14 bg-primary-container rounded-full flex-row items-center justify-center gap-2"
            style={belowMinimum ? { opacity: 0.5 } : undefined}
          >
            <Text className="text-on-primary-container font-bold text-lg">{t('cart.checkout')}</Text>
            <Icon name="arrow-forward" color={palette.onPrimaryContainer} size={20} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <DeliveryAddressSheet
        visible={addressSheetVisible}
        onClose={() => setAddressSheetVisible(false)}
      />
    </SafeAreaView>
  );
}
