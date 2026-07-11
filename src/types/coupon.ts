/**
 * types/coupon.ts
 * Colección coupons/{code} — el código ES el ID del documento (PDF QuickBite).
 */

export type CouponType = 'percent' | 'fixed';

export interface Coupon {
  /** Igual al ID del documento */
  code: string;
  restaurantId: string;
  type: CouponType;
  /** 10 = 10% si type=percent, o $10 si type=fixed */
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  expiresAt: Date | null;
  isActive: boolean;
}

export interface CouponFormData {
  code: string;
  type: CouponType;
  value: string;
  minOrder: string;
  maxUses: string;
  /** Formato YYYY-MM-DD */
  expiresAt: string;
  isActive: boolean;
}
