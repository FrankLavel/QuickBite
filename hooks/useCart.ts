import { useCartStore } from '@/store/cartStore';

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

  return {
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
    total: total(),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}
