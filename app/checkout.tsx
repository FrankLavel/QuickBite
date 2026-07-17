import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { restaurantsService } from '@/services/restaurants.service';
import { ordersService } from '@/services/orders.service';
import { couponDiscount } from '@/services/coupons.service';
import { useTranslation } from '@/hooks/useTranslation';
import { DeliveryAddressSheet } from '@/components/address/DeliveryAddressSheet';
import { Restaurant } from '@/types/restaurant.types';
import { NewOrderInput, OrderItem, PaymentMethod } from '@/types/order.types';

const PAYMENT_METHODS: { id: PaymentMethod; icon: IconName }[] = [
  { id: 'card', icon: 'credit-card' },
  { id: 'paypal', icon: 'account-balance-wallet' },
  { id: 'cash', icon: 'payments' },
];

const QUICK_NOTE_KEYS = ['checkout.leaveDoor', 'checkout.callOutside', 'checkout.handToMe'];

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 4 },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { items, restaurantId, coupon, total: subtotal, clearCart } = useCart();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [instructions, setInstructions] = useState('');
  const [placing, setPlacing] = useState(false);
  const [addressSheetVisible, setAddressSheetVisible] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    restaurantsService.getById(restaurantId).then(setRestaurant);
  }, [restaurantId]);

  const deliveryFee = restaurant?.deliveryFee ?? 0;
  const discount =
    coupon && subtotal >= coupon.minOrder ? couponDiscount(coupon, subtotal) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const defaultAddress =
    user?.addresses?.find((a) => a.isDefault) ?? user?.addresses?.[0] ?? null;

  const addNote = (text: string) =>
    setInstructions((prev) => (prev ? `${prev}, ${text}` : text));

  const confirmOrder = async () => {
    if (placing) return;
    if (!user || !restaurantId) return;
    if (!defaultAddress) {
      Alert.alert(t('checkout.addressAlertTitle'), t('checkout.addressAlertMsg'));
      return;
    }

    const orderItems: OrderItem[] = items.map((i) => ({
      productId: i.productId,
      name: i.name,
      qty: i.quantity,
      price: i.price,
      toppings: i.toppings ?? [],
      subtotal: round2(i.price * i.quantity),
      // Solo incluir notes si existe (Firestore rechaza undefined).
      ...(i.notes ? { notes: i.notes } : {}),
    }));

    const input: NewOrderInput = {
      customerId: user.uid,
      // Nombre y teléfono denormalizados para que el restaurante los vea/contacte.
      ...(user.name?.trim() ? { customerName: user.name.trim() } : {}),
      ...(user.phone?.trim() ? { customerPhone: user.phone.trim() } : {}),
      restaurantId,
      items: orderItems,
      subtotal: round2(subtotal),
      deliveryFee,
      discount,
      total: round2(total),
      deliveryAddress: {
        street: defaultAddress.street,
        city: defaultAddress.city,
        ...(defaultAddress.references ? { references: defaultAddress.references } : {}),
        coords: defaultAddress.coords,
      },
      paymentMethod: payment,
      // Solo registra/gasta el cupón si realmente aplicó un descuento (> 0).
      couponCode: coupon && discount > 0 ? coupon.code : null,
      ...(instructions.trim() ? { specialInstructions: instructions.trim() } : {}),
    };

    setPlacing(true);
    try {
      const orderId = await ordersService.createOrder(input);
      clearCart();
      router.replace(`/confirmation?orderId=${orderId}`);
    } catch {
      setPlacing(false);
      Alert.alert(t('common.error'), t('checkout.errorMsg'));
    }
  };

  if (items.length === 0 && !placing) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row items-center gap-2 px-4 py-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full">
            <Icon name="arrow-back" color={palette.primary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-primary tracking-tight">QuickBite</Text>
        </View>
        <View className="flex-1 items-center justify-center gap-2 px-6">
          <Icon name="shopping-bag" size={48} color={palette.outline} />
          <Text className="text-on-surface-variant text-center">{t('checkout.emptyCart')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Top App Bar */}
      <View className="flex-row justify-between items-center px-4 py-2 bg-background">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} className="p-2 rounded-full">
            <Icon name="arrow-back" color={palette.primary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-primary tracking-tight">QuickBite</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Icon name="location-on" size={20} />
          <Text className="text-sm font-semibold text-on-surface-variant">
            {defaultAddress?.label ?? t('checkout.deliverTo')}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6 gap-6"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* Delivery address */}
        <View className="bg-surface-container-lowest rounded-xl p-4" style={cardShadow}>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-bold uppercase tracking-wider text-secondary">{t('cart.deliveryAddress')}</Text>
            <TouchableOpacity onPress={() => setAddressSheetVisible(true)}>
              <Text className="text-primary text-sm font-bold">{defaultAddress ? t('common.change') : t('common.add')}</Text>
            </TouchableOpacity>
          </View>
          {defaultAddress ? (
            <View className="flex-row items-center gap-3">
              <View className="bg-primary-container p-2 rounded-full">
                <Icon name="location-on" color={palette.onPrimaryContainer} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-on-surface">{defaultAddress.label}</Text>
                <Text className="text-sm text-on-surface-variant" numberOfLines={1}>
                  {defaultAddress.street}, {defaultAddress.city}
                </Text>
                {!!defaultAddress.references && (
                  <Text className="text-xs text-on-surface-variant" numberOfLines={1}>
                    {defaultAddress.references}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setAddressSheetVisible(true)}
              className="flex-row items-center gap-2 py-2"
            >
              <Icon name="add-location-alt" color={palette.primary} />
              <Text className="text-on-surface-variant">{t('cart.addAddress')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Delivery estimation banner */}
        <View className="bg-primary-container/10 border border-primary/20 rounded-xl p-4 flex-row items-center gap-4">
          <View className="bg-primary-container p-2 rounded-full">
            <Icon name="schedule" color={palette.onPrimaryContainer} />
          </View>
          <View>
            <Text className="text-lg font-bold text-on-primary-container">{t('product.estimatedDelivery')}</Text>
            <Text className="text-base font-semibold text-primary">
              {restaurant?.deliveryTime ?? '25 - 35 min'}
            </Text>
          </View>
        </View>

        {/* Payment method */}
        <View className="bg-surface-container-lowest rounded-xl p-6 gap-4" style={cardShadow}>
          <Text className="text-xl font-bold text-on-surface">{t('checkout.paymentMethod')}</Text>
          <View className="gap-4">
            {PAYMENT_METHODS.map((m) => {
              const isOn = payment === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setPayment(m.id)}
                  className={`flex-row items-center justify-between p-4 border rounded-xl ${
                    isOn ? 'border-primary' : 'border-outline-variant'
                  }`}
                >
                  <View className="flex-row items-center gap-4">
                    <View className="w-12 h-12 bg-surface-container rounded-lg items-center justify-center">
                      <Icon name={m.icon} color={palette.onSurfaceVariant} />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-on-surface">{t(`checkout.${m.id}`)}</Text>
                      <Text className="text-xs text-on-surface-variant">{t(`checkout.${m.id}Sub`)}</Text>
                    </View>
                  </View>
                  <Icon
                    name={isOn ? 'radio-button-checked' : 'radio-button-unchecked'}
                    color={isOn ? palette.primary : palette.outline}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Delivery instructions */}
        <View className="bg-surface-container-lowest rounded-xl p-6 gap-3" style={cardShadow}>
          <Text className="text-xl font-bold text-on-surface">{t('checkout.instructions')}</Text>
          <Text className="text-sm font-semibold text-on-surface">{t('checkout.noteCourier')}</Text>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder={t('checkout.instructionsPlaceholder')}
            placeholderTextColor={palette.onSurfaceVariant}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="bg-surface-container-low rounded-xl p-4 text-base text-on-surface min-h-[88px]"
          />
          <View className="flex-row flex-wrap gap-2 mt-1">
            {QUICK_NOTE_KEYS.map((noteKey) => {
              const note = t(noteKey);
              return (
                <TouchableOpacity
                  key={noteKey}
                  onPress={() => addNote(note)}
                  className="bg-surface-container px-4 py-1 rounded-full"
                >
                  <Text className="text-xs font-medium text-on-surface-variant">{note}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Order summary */}
        <View className="bg-surface-container-lowest rounded-xl p-6" style={cardShadow}>
          <Text className="text-xl font-bold text-on-surface mb-6">{t('checkout.orderSummary')}</Text>

          <View className="gap-4 mb-6">
            {items.map((item) => (
              <View key={item.id} className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-4 flex-1 pr-2">
                  <View className="w-8 h-8 rounded-lg bg-primary-container/20 items-center justify-center">
                    <Text className="text-sm font-bold text-primary">{item.quantity}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-on-surface" numberOfLines={1}>{item.name}</Text>
                    {item.toppings && item.toppings.length > 0 && (
                      <Text className="text-xs text-on-surface-variant" numberOfLines={1}>
                        {item.toppings.map((t) => t.name).join(', ')}
                      </Text>
                    )}
                    {!!item.notes && (
                      <Text className="text-xs text-on-surface-variant italic" numberOfLines={2}>
                        {t('cart.note')}: {item.notes}
                      </Text>
                    )}
                  </View>
                </View>
                <Text className="text-sm font-bold text-on-surface">
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View className="border-t border-outline-variant pt-6 gap-2">
            <View className="flex-row justify-between">
              <Text className="text-sm font-semibold text-on-surface-variant">{t('cart.subtotal')}</Text>
              <Text className="text-sm font-semibold text-on-surface-variant">${subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm font-semibold text-on-surface-variant">{t('cart.deliveryFee')}</Text>
              <Text className="text-sm font-semibold text-on-surface-variant">
                {deliveryFee === 0 ? t('common.free') : `$${deliveryFee.toFixed(2)}`}
              </Text>
            </View>
            {discount > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-sm font-semibold text-primary">{t('cart.discount')} ({coupon?.code})</Text>
                <Text className="text-sm font-semibold text-primary">-${discount.toFixed(2)}</Text>
              </View>
            )}
            <View className="flex-row justify-between pt-4 mt-2 border-t border-outline-variant">
              <Text className="text-xl font-bold text-on-surface">{t('cart.total')}</Text>
              <Text className="text-xl font-bold text-on-surface">${total.toFixed(2)}</Text>
            </View>
          </View>

          {!defaultAddress && (
            <Text className="text-error text-sm text-center mt-4">
              {t('checkout.addressRequired')}
            </Text>
          )}

          <TouchableOpacity
            onPress={confirmOrder}
            disabled={placing || !defaultAddress}
            activeOpacity={0.9}
            className="mt-6 h-14 bg-primary-container rounded-full flex-row items-center justify-center gap-2"
            style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 30, shadowOffset: { width: 0, height: 8 }, ...(placing || !defaultAddress ? { opacity: 0.5 } : {}) }}
          >
            {placing ? (
              <ActivityIndicator color={palette.onPrimaryContainer} />
            ) : (
              <>
                <Icon name="lock" color={palette.onPrimaryContainer} size={20} />
                <Text className="text-on-primary-container font-bold text-lg">{t('checkout.confirmOrder')}</Text>
              </>
            )}
          </TouchableOpacity>

          <Text className="text-center text-xs text-on-surface-variant mt-4">
            {t('checkout.secure')}
          </Text>
        </View>
      </ScrollView>

      <DeliveryAddressSheet
        visible={addressSheetVisible}
        onClose={() => setAddressSheetVisible(false)}
      />
    </SafeAreaView>
  );
}
