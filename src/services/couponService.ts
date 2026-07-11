/**
 * services/couponService.ts
 * CRUD coupons/{code} — cupones de descuento del restaurante (PDF).
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '../utils/constants';
import type { Coupon, CouponFormData } from '../types/coupon';

function couponsRef() {
  return collection(db, COLLECTIONS.COUPONS);
}

function couponDoc(code: string) {
  return doc(db, COLLECTIONS.COUPONS, normalizeCouponCode(code));
}

function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

function parseExpiresAt(value: string): Timestamp | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(`${trimmed}T23:59:59`);
  if (Number.isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
}

function mapCoupon(code: string, data: Record<string, unknown>): Coupon {
  let expiresAt: Date | null = null;
  const raw = data.expiresAt;
  if (raw && typeof raw === 'object' && 'toDate' in raw) {
    expiresAt = (raw as { toDate: () => Date }).toDate();
  }

  return {
    code,
    restaurantId: (data.restaurantId as string) ?? '',
    type: (data.type as Coupon['type']) ?? 'percent',
    value: Number(data.value) || 0,
    minOrder: Number(data.minOrder) || 0,
    maxUses: Number(data.maxUses) || 0,
    usedCount: Number(data.usedCount) || 0,
    expiresAt,
    isActive: data.isActive !== false,
  };
}

export async function getCouponsByRestaurant(
  restaurantId: string
): Promise<Coupon[]> {
  const q = query(
    couponsRef(),
    where('restaurantId', '==', restaurantId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCoupon(d.id, d.data()));
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const snap = await getDoc(couponDoc(code));
  if (!snap.exists()) return null;
  return mapCoupon(snap.id, snap.data());
}

export async function createCoupon(
  restaurantId: string,
  form: CouponFormData
): Promise<Coupon> {
  const code = normalizeCouponCode(form.code);
  if (!code) throw new Error('El código del cupón es obligatorio');

  const existing = await getDoc(couponDoc(code));
  if (existing.exists()) {
    throw new Error('Ya existe un cupón con ese código');
  }

  const payload = {
    code,
    restaurantId,
    type: form.type,
    value: parseFloat(form.value) || 0,
    minOrder: parseFloat(form.minOrder) || 0,
    maxUses: parseInt(form.maxUses, 10) || 1,
    usedCount: 0,
    expiresAt: parseExpiresAt(form.expiresAt),
    isActive: form.isActive,
  };

  await setDoc(couponDoc(code), payload);
  return mapCoupon(code, payload);
}

export async function updateCoupon(
  code: string,
  form: CouponFormData
): Promise<void> {
  const normalized = normalizeCouponCode(code);
  const payload = {
    type: form.type,
    value: parseFloat(form.value) || 0,
    minOrder: parseFloat(form.minOrder) || 0,
    maxUses: parseInt(form.maxUses, 10) || 1,
    expiresAt: parseExpiresAt(form.expiresAt),
    isActive: form.isActive,
  };
  await updateDoc(couponDoc(normalized), payload);
}

export async function deleteCoupon(code: string): Promise<void> {
  await deleteDoc(couponDoc(code));
}

export async function setCouponActive(
  code: string,
  isActive: boolean
): Promise<void> {
  await updateDoc(couponDoc(code), { isActive });
}

export function couponToFormData(coupon: Coupon): CouponFormData {
  const expiresAt = coupon.expiresAt
    ? coupon.expiresAt.toISOString().slice(0, 10)
    : '';
  return {
    code: coupon.code,
    type: coupon.type,
    value: String(coupon.value),
    minOrder: String(coupon.minOrder),
    maxUses: String(coupon.maxUses),
    expiresAt,
    isActive: coupon.isActive,
  };
}

export function isCouponExpired(coupon: Coupon): boolean {
  if (!coupon.expiresAt) return false;
  return coupon.expiresAt.getTime() < Date.now();
}

export function isCouponExhausted(coupon: Coupon): boolean {
  return coupon.usedCount >= coupon.maxUses;
}

/** Motivo por el que no se puede canjear (null = válido). Alineado con firestore.rules. */
export function getCouponRedemptionBlockReason(
  coupon: Coupon
): 'inactive' | 'expired' | 'exhausted' | null {
  if (!coupon.isActive) return 'inactive';
  if (isCouponExpired(coupon)) return 'expired';
  if (isCouponExhausted(coupon)) return 'exhausted';
  return null;
}

export function canRedeemCoupon(coupon: Coupon): boolean {
  return getCouponRedemptionBlockReason(coupon) === null;
}

export { normalizeCouponCode };
