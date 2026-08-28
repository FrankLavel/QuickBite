import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/ui/Icon';
import { showAlert } from '@/store/dialogStore';
import { palette } from '@/constants/colors';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users.service';
import { restaurantsService } from '@/services/restaurants.service';
import { ordersService } from '@/services/orders.service';
import {
  paymentsService,
  OpenpayToken,
  CardChargePayload,
  newOrderId,
} from '@/services/payments.service';
import { couponDiscount } from '@/services/coupons.service';
import { isRestaurantOpen } from '@/lib/schedule';
import { checkDeliveryCoverage } from '@/lib/geo';
import { lineSubtotal } from '@/lib/promo';
import { useTranslation } from '@/hooks/useTranslation';
import { useSavedCards } from '@/hooks/useSavedCards';
import { DeliveryAddressSheet } from '@/components/address/DeliveryAddressSheet';
import { OpenpayCardSheet } from '@/components/payment/OpenpayCardSheet';
import { SavedCardPicker } from '@/components/payment/SavedCardPicker';
import { OpenpayDeviceSession } from '@/components/payment/OpenpayDeviceSession';
import { Restaurant } from '@/types/restaurant.types';
import { NewOrderInput, OrderItem, PaymentMethod } from '@/types/order.types';

// PayPal se oculta por ahora: no hay integración real (elegirlo crearía un
// pedido "pendiente" sin cobro). Se ofrecen solo Tarjeta (Openpay) y Efectivo.
const PAYMENT_METHODS: { id: PaymentMethod; icon: IconName }[] = [
  { id: 'card', icon: 'credit-card' },
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
  const [tip, setTip] = useState(0);
  const [instructions, setInstructions] = useState('');
  const [placing, setPlacing] = useState(false);
  const [addressSheetVisible, setAddressSheetVisible] = useState(false);
  const [cardSheetVisible, setCardSheetVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  // Cuando != null, se monta el WebView headless para generar el device_session
  // y cobrar esa tarjeta guardada (pago de un toque).
  const [savedPayCardId, setSavedPayCardId] = useState<string | null>(null);
  const { cards } = useSavedCards();
  // Id de pedido estable para el pago con tarjeta: se conserva entre reintentos
  // del mismo checkout (idempotencia anti-doble-cobro) y se reinicia al concretar.
  const cardOrderId = useRef<string | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    restaurantsService.getById(restaurantId).then(setRestaurant);
  }, [restaurantId]);

  const deliveryFee = restaurant?.deliveryFee ?? 0;
  const discount =
    coupon && subtotal >= coupon.minOrder ? couponDiscount(coupon, subtotal) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  // Monto a pagar: el total del pedido + la propina (solo en efectivo).
  const payTotal = total + (payment === 'cash' ? tip : 0);

  const defaultAddress =
    user?.addresses?.find((a) => a.isDefault) ?? user?.addresses?.[0] ?? null;

  // Teléfono de contacto: obligatorio en el pedido para que el restaurante pueda
  // marcar. Si la cuenta no lo tiene (p. ej. registro con Google), se pide aquí.
  const [phone, setPhone] = useState('');
  const needsPhone = !(user?.phone ?? '').trim();
  const contactPhone = (user?.phone ?? '').trim() || phone.trim();

  // Cobertura: ¿la dirección de entrega cae dentro del radio de reparto del
  // restaurante? Falla en abierto si faltan datos (ver checkDeliveryCoverage).
  const coverage = restaurant
    ? checkDeliveryCoverage(restaurant, defaultAddress?.coords ?? null)
    : { ok: true as const };

  const addNote = (text: string) =>
    setInstructions((prev) => (prev ? `${prev}, ${text}` : text));

  /** Arma el NewOrderInput con el estado actual del checkout. */
  const buildOrderInput = (): NewOrderInput | null => {
    if (!user || !restaurantId || !defaultAddress) return null;

    const orderItems: OrderItem[] = items.map((i) => {
      // Con promo, el precio unitario que se envía ya lleva el descuento (el
      // servidor cobra price*qty), y el subtotal refleja la línea con promo.
      const sub = round2(lineSubtotal(i));
      const price = i.quantity > 0 ? sub / i.quantity : i.price;
      return {
        productId: i.productId,
        name: i.name,
        qty: i.quantity,
        price,
        toppings: i.toppings ?? [],
        subtotal: sub,
        // Solo incluir notes si existe (Firestore rechaza undefined).
        ...(i.notes ? { notes: i.notes } : {}),
        ...(i.promo ? { promo: i.promo } : {}),
      };
    });

    return {
      customerId: user.uid,
      // Nombre y teléfono denormalizados para que el restaurante los vea/contacte.
      ...(user.name?.trim() ? { customerName: user.name.trim() } : {}),
      ...(contactPhone ? { customerPhone: contactPhone } : {}),
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
      // Propina solo en efectivo (se paga en mano al repartidor, no se cobra a tarjeta).
      ...(payment === 'cash' && tip > 0 ? { tip } : {}),
      // Solo registra/gasta el cupón si realmente aplicó un descuento (> 0).
      couponCode: coupon && discount > 0 ? coupon.code : null,
      ...(instructions.trim() ? { specialInstructions: instructions.trim() } : {}),
    };
  };

  const confirmOrder = async () => {
    if (placing) return;
    if (!user || !restaurantId) return;
    if (!defaultAddress) {
      void showAlert({ title: t('checkout.addressAlertTitle'), message: t('checkout.addressAlertMsg') });
      return;
    }
    // El restaurante debe estar abierto para completar el pedido.
    if (restaurant && !isRestaurantOpen(restaurant)) {
      void showAlert({ title: t('checkout.closedTitle'), message: t('checkout.closedMsg') });
      return;
    }
    // La dirección debe estar dentro del radio de reparto del restaurante.
    if (!coverage.ok) {
      void showAlert({
        title: t('checkout.outOfRangeTitle'),
        message: t('checkout.outOfRangeMsg', {
          distance: coverage.distanceKm!.toFixed(1),
          zone: coverage.zoneKm!,
        }),
      });
      return;
    }
    // Teléfono de contacto obligatorio (10 dígitos).
    if (contactPhone.replace(/\D/g, '').length < 10) {
      void showAlert({ title: t('checkout.phoneTitle'), message: t('checkout.phoneMsg') });
      return;
    }
    // Si el usuario acaba de escribir su teléfono, lo guarda en su perfil para
    // no volver a pedirlo en los próximos pedidos.
    if (needsPhone && contactPhone) {
      try {
        await usersService.updateProfile(user.uid, { phone: contactPhone });
        useAuthStore.getState().setUser({ ...user, phone: contactPhone });
      } catch {
        // no bloquea el pedido; el teléfono igual va en customerPhone
      }
    }

    // Pago con tarjeta: se cobra vía Openpay (WebView + Cloud Function). El
    // pedido lo crea el backend solo si el cargo es exitoso.
    if (payment === 'card') {
      // Genera el id una sola vez por checkout; los reintentos reusan el mismo
      // para que el backend no cobre dos veces.
      if (!cardOrderId.current) cardOrderId.current = newOrderId();
      // Si el usuario tiene tarjetas guardadas, ofrece elegir (pago de un toque);
      // si no, va directo a capturar una tarjeta nueva.
      if (cards.length > 0) setPickerVisible(true);
      else setCardSheetVisible(true);
      return;
    }

    // Efectivo / PayPal: se crea el pedido directamente (paymentStatus 'pending').
    const input = buildOrderInput();
    if (!input) return;

    setPlacing(true);
    try {
      const orderId = await ordersService.createOrder(input);
      clearCart();
      router.replace(`/confirmation?orderId=${orderId}`);
    } catch {
      setPlacing(false);
      void showAlert({ title: t('common.error'), message: t('checkout.errorMsg') });
    }
  };

  /** Cobra con tarjeta (nueva o guardada) vía el backend. */
  const chargeCard = async (payload: CardChargePayload) => {
    const input = buildOrderInput();
    if (!input) {
      setPlacing(false);
      return;
    }
    if (!cardOrderId.current) cardOrderId.current = newOrderId();
    const orderId = cardOrderId.current;

    setPlacing(true);
    try {
      const createdId = await paymentsService.createCardOrder(input, orderId, payload);
      cardOrderId.current = null; // éxito: el próximo pedido usa un id nuevo.
      clearCart();
      router.replace(`/confirmation?orderId=${createdId}`);
    } catch (e) {
      setPlacing(false);
      const message =
        e instanceof Error && e.message ? e.message : t('checkout.errorMsg');
      void showAlert({ title: t('checkout.paymentErrorTitle'), message });
    }
  };

  /** Tarjeta NUEVA tokenizada (con opción de guardarla). */
  const onCardToken = (token: OpenpayToken, saveCard: boolean) => {
    setCardSheetVisible(false);
    chargeCard({
      tokenId: token.tokenId,
      deviceSessionId: token.deviceSessionId,
      saveCard,
    });
  };

  /** Eligió una tarjeta guardada: monta el WebView para el device_session. */
  const onSelectSavedCard = (cardId: string) => {
    setPickerVisible(false);
    setPlacing(true);
    setSavedPayCardId(cardId);
  };

  /** device_session listo → cobra la tarjeta guardada (un toque). */
  const onDeviceReady = (deviceSessionId: string) => {
    const cardId = savedPayCardId;
    setSavedPayCardId(null);
    if (cardId) chargeCard({ savedCardId: cardId, deviceSessionId });
  };

  const onDeviceError = (message: string) => {
    setSavedPayCardId(null);
    setPlacing(false);
    void showAlert({ title: t('checkout.paymentErrorTitle'), message });
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
                {!coverage.ok && (
                  <View className="flex-row items-center gap-1 mt-1">
                    <Icon name="error-outline" color={palette.error} size={14} />
                    <Text className="text-xs font-semibold text-error flex-1">
                      {t('checkout.outOfRangeBadge', {
                        distance: coverage.distanceKm!.toFixed(1),
                        zone: coverage.zoneKm!,
                      })}
                    </Text>
                  </View>
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

        {/* Teléfono de contacto (solo si la cuenta no lo tiene, p. ej. Google) */}
        {needsPhone && (
          <View className="bg-surface-container-lowest rounded-xl p-4" style={cardShadow}>
            <Text className="text-sm font-bold uppercase tracking-wider text-secondary mb-2">
              {t('checkout.contactPhone')}
            </Text>
            <View className="flex-row items-center gap-3">
              <View className="bg-primary-container p-2 rounded-full">
                <Icon name="call" color={palette.onPrimaryContainer} />
              </View>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder={t('checkout.contactPhoneHint')}
                placeholderTextColor={palette.outline}
                keyboardType="phone-pad"
                className="flex-1 h-11 px-3 bg-surface-container rounded-xl text-base text-on-surface"
              />
            </View>
          </View>
        )}

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

        {/* Tip (solo efectivo: se paga en mano al repartidor) */}
        {payment === 'cash' && (
          <View className="bg-surface-container-lowest rounded-xl p-6 gap-3" style={cardShadow}>
            <Text className="text-xl font-bold text-on-surface">{t('checkout.tip')}</Text>
            <Text className="text-sm text-on-surface-variant">{t('checkout.tipSub')}</Text>
            <View className="flex-row gap-2">
              {[0, 10, 20, 30].map((amount) => {
                const isOn = tip === amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => setTip(amount)}
                    className={`flex-1 items-center py-3 border rounded-xl ${
                      isOn ? 'border-primary bg-primary/10' : 'border-outline-variant'
                    }`}
                  >
                    <Text className={`text-sm font-bold ${isOn ? 'text-primary' : 'text-on-surface'}`}>
                      {amount === 0 ? t('checkout.tipNone') : `$${amount}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

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
                  ${round2(lineSubtotal(item)).toFixed(2)}
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
            {payment === 'cash' && tip > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-sm font-semibold text-on-surface-variant">{t('checkout.tip')}</Text>
                <Text className="text-sm font-semibold text-on-surface-variant">${tip.toFixed(2)}</Text>
              </View>
            )}
            <View className="flex-row justify-between pt-4 mt-2 border-t border-outline-variant">
              <Text className="text-xl font-bold text-on-surface">{t('cart.total')}</Text>
              <Text className="text-xl font-bold text-on-surface">${payTotal.toFixed(2)}</Text>
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

      <SavedCardPicker
        visible={pickerVisible}
        cards={cards}
        amountLabel={`$${total.toFixed(2)}`}
        onSelect={onSelectSavedCard}
        onNewCard={() => {
          setPickerVisible(false);
          setCardSheetVisible(true);
        }}
        onClose={() => setPickerVisible(false)}
      />

      <OpenpayCardSheet
        visible={cardSheetVisible}
        amountLabel={`$${total.toFixed(2)}`}
        showSaveToggle
        onClose={() => setCardSheetVisible(false)}
        onToken={onCardToken}
      />

      {/* WebView headless para el device_session de una tarjeta guardada. */}
      {savedPayCardId && (
        <OpenpayDeviceSession onReady={onDeviceReady} onError={onDeviceError} />
      )}
    </SafeAreaView>
  );
}
