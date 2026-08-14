import { Alert } from 'react-native';
import { useCartStore } from '@/store/cartStore';
import { useLangStore } from '@/store/langStore';
import { translate } from '@/lib/i18n';
import type { CartItemType } from '@/types/order.types';

export function useCart() {
  const {
    items,
    restaurantId,
    coupon,
    pendingCouponCode,
    addItem,
    removeItem,
    incrementItem,
    decrementItem,
    setCoupon,
    setPendingCoupon,
    reorder,
    clearCart,
    total,
  } = useCartStore();

  const lang = useLangStore((s) => s.lang);

  /**
   * Agrega al carrito respetando la regla de "un pedido = un restaurante". Si el
   * carrito ya tiene platillos de OTRO restaurante, pide confirmación antes de
   * vaciarlo (en vez de borrarlo en silencio). Devuelve true si se agregó.
   */
  const addItemGuarded = async (
    item: CartItemType,
    newRestaurantId: string
  ): Promise<boolean> => {
    if (restaurantId && restaurantId !== newRestaurantId && items.length > 0) {
      const ok = await new Promise<boolean>((resolve) => {
        Alert.alert(
          translate(lang, 'cart.switchTitle'),
          translate(lang, 'cart.switchMsg'),
          [
            {
              text: translate(lang, 'cart.switchCancel'),
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: translate(lang, 'cart.switchConfirm'),
              style: 'destructive',
              onPress: () => resolve(true),
            },
          ],
          { cancelable: true, onDismiss: () => resolve(false) }
        );
      });
      if (!ok) return false;
    }
    addItem(item, newRestaurantId);
    return true;
  };

  return {
    items,
    restaurantId,
    coupon,
    pendingCouponCode,
    addItem,
    addItemGuarded,
    removeItem,
    incrementItem,
    decrementItem,
    setCoupon,
    setPendingCoupon,
    reorder,
    clearCart,
    total: total(),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}
