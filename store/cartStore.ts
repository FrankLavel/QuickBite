import { create } from 'zustand';
import { CartItemType, OrderItemTopping } from '@/types/order.types';
import { Coupon } from '@/types/coupon.types';
import { cartTotal } from '@/lib/promo';

/**
 * ID de línea del carrito: mismo producto + mismos toppings + misma nota = misma
 * línea (se acumula la cantidad); cualquier diferencia = línea separada. Los
 * toppings se ordenan para que el orden de selección no importe.
 */
export function cartLineId(
  productId: string,
  toppings?: OrderItemTopping[],
  notes?: string
): string {
  const t = (toppings ?? []).map((x) => x.name).sort().join(',');
  return `${productId}|${t}|${notes?.trim() ?? ''}`;
}

interface CartState {
  items: CartItemType[];
  restaurantId: string | null;
  coupon: Coupon | null;
  /** Código de cupón sugerido por una oferta, para aplicar en el carrito. */
  pendingCouponCode: string | null;
  addItem: (item: CartItemType, restaurantId: string) => void;
  removeItem: (itemId: string) => void;
  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  setCoupon: (coupon: Coupon | null) => void;
  setPendingCoupon: (code: string | null) => void;
  /** Reemplaza el carrito completo con los ítems de un pedido (reordenar). */
  reorder: (items: CartItemType[], restaurantId: string) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  restaurantId: null,
  coupon: null,
  pendingCouponCode: null,
  addItem: (item, restaurantId) =>
    set((state) => {
      // Un pedido es de un solo restaurante: si cambia, se reinicia el carrito.
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        return { items: [{ ...item, quantity: item.quantity || 1 }], restaurantId, coupon: null };
      }
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: item.quantity || 1 }], restaurantId };
    }),
  removeItem: (itemId) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) })),
  incrementItem: (itemId) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i)),
    })),
  decrementItem: (itemId) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    })),
  setCoupon: (coupon) => set({ coupon }),
  setPendingCoupon: (pendingCouponCode) => set({ pendingCouponCode }),
  reorder: (items, restaurantId) =>
    set({ items, restaurantId, coupon: null, pendingCouponCode: null }),
  clearCart: () =>
    set({ items: [], restaurantId: null, coupon: null, pendingCouponCode: null }),
  total: () => cartTotal(get().items),
}));
