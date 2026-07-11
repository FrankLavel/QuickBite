import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Coupon } from '@/types/coupon.types';

export type CouponInvalidReason =
  | 'not_found'
  | 'inactive'
  | 'expired'
  | 'max_uses'
  | 'min_order';

export type CouponValidation =
  | { valid: true; discount: number; coupon: Coupon }
  | { valid: false; discount: 0; reason: CouponInvalidReason; coupon?: Coupon };

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Calcula el monto de descuento de un cupón ya validado contra un subtotal.
 * Útil para recomputar el descuento si el carrito cambia tras aplicarlo.
 */
export function couponDiscount(coupon: Coupon, subtotal: number): number {
  const raw =
    coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  return round2(Math.min(raw, subtotal));
}

export const couponsService = {
  /**
   * Valida un cupón contra el subtotal actual y calcula el descuento.
   * Reglas (doc móvil): isActive, expiresAt > now, usedCount < maxUses,
   * subtotal >= minOrder. El usedCount++ se hace al crear el pedido.
   */
  validate: async (
    code: string,
    subtotal: number
  ): Promise<CouponValidation> => {
    const id = code.trim();
    if (!id) return { valid: false, discount: 0, reason: 'not_found' };

    const snap = await getDoc(doc(db, 'coupons', id));
    if (!snap.exists()) return { valid: false, discount: 0, reason: 'not_found' };

    const coupon = { code: snap.id, ...snap.data() } as Coupon;

    if (!coupon.isActive)
      return { valid: false, discount: 0, reason: 'inactive', coupon };
    if (coupon.expiresAt.toMillis() <= Date.now())
      return { valid: false, discount: 0, reason: 'expired', coupon };
    if (coupon.usedCount >= coupon.maxUses)
      return { valid: false, discount: 0, reason: 'max_uses', coupon };
    if (subtotal < coupon.minOrder)
      return { valid: false, discount: 0, reason: 'min_order', coupon };

    return { valid: true, discount: couponDiscount(coupon, subtotal), coupon };
  },
};
