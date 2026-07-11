import { Timestamp } from 'firebase/firestore';

export type CouponType = 'percent' | 'fixed';

/**
 * Documento /coupons/{code}. El code es el ID del documento. Lectura para
 * cualquier usuario autenticado; escritura solo del restaurante dueño
 * (restaurantId) desde el Dashboard Web.
 */
export interface Coupon {
  code: string;
  /** Restaurante al que pertenece el cupón. */
  restaurantId: string;
  /** percent = porcentaje del subtotal | fixed = monto fijo. */
  type: CouponType;
  /** 10 para 10% | 2.50 para $2.50 de descuento. */
  value: number;
  /** Monto mínimo del subtotal para poder aplicar el cupón. */
  minOrder: number;
  /** Límite total de usos del cupón. */
  maxUses: number;
  /** Usos actuales. La app verifica que usedCount < maxUses. */
  usedCount: number;
  expiresAt: Timestamp;
  isActive: boolean;
}
