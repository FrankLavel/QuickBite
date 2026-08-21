/**
 * services/offerService.ts
 * CRUD offers/{offerId} — banners promocionales (PDF).
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { uploadOfferImage } from './storageService';
import { COLLECTIONS } from '../utils/constants';
import { normalizeImageUrl } from '../utils/imageUrl';
import type { Offer, OfferFormData, OfferType } from '../types/offer';

function offersRef() {
  return collection(db, COLLECTIONS.OFFERS);
}

function offerDoc(offerId: string) {
  return doc(db, COLLECTIONS.OFFERS, offerId);
}

/** YYYY-MM-DD → Timestamp. `endOfDay` fija 23:59:59 (fin de vigencia). */
function parseDate(value: string, endOfDay: boolean): Timestamp | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(`${trimmed}T${endOfDay ? '23:59:59' : '00:00:00'}`);
  if (Number.isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
}

/** Timestamp de Firestore → Date (o null). */
function toDate(raw: unknown): Date | null {
  if (raw && typeof raw === 'object' && 'toDate' in raw) {
    return (raw as { toDate: () => Date }).toDate();
  }
  return null;
}

/** Date → YYYY-MM-DD (para precargar el formulario). */
function toDateInput(date: Date | null | undefined): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mapOffer(id: string, data: Record<string, unknown>): Offer {
  return {
    id,
    restaurantId: (data.restaurantId as string) ?? '',
    type: (data.type as OfferType) ?? 'banner',
    badge: (data.badge as string) ?? '',
    title: (data.title as string) ?? '',
    description: (data.description as string) ?? '',
    image: normalizeImageUrl(data.image as string) ?? '',
    couponCode: (data.couponCode as string) || undefined,
    productId: (data.productId as string) || undefined,
    discountKind: (data.discountKind as Offer['discountKind']) || undefined,
    discountPercent:
      data.discountPercent != null ? Number(data.discountPercent) : undefined,
    startsAt: toDate(data.startsAt),
    endsAt: toDate(data.endsAt),
    isActive: data.isActive !== false,
  };
}

/** Campos derivados del tipo: cupón/platillo/descuento solo aplican a su tipo. */
function typedFields(form: OfferFormData) {
  const isDish = form.type === 'dish';
  const discountKind = isDish && form.discountKind ? form.discountKind : null;
  return {
    type: form.type,
    couponCode: form.type === 'coupon' ? form.couponCode.trim() || null : null,
    productId: isDish ? form.productId || null : null,
    discountKind,
    discountPercent:
      discountKind === 'percent'
        ? Math.min(Math.max(parseFloat(form.discountPercent) || 0, 0), 100)
        : null,
    startsAt: parseDate(form.startsAt, false),
    endsAt: parseDate(form.endsAt, true),
  };
}

export async function getOffersByRestaurant(
  restaurantId: string
): Promise<Offer[]> {
  const q = query(
    offersRef(),
    where('restaurantId', '==', restaurantId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapOffer(d.id, d.data()));
}

export async function createOffer(
  restaurantId: string,
  form: OfferFormData
): Promise<Offer> {
  let image = normalizeImageUrl(form.image) ?? '';

  const payload = {
    restaurantId,
    badge: form.badge.trim(),
    title: form.title.trim(),
    description: form.description.trim(),
    image,
    isActive: form.isActive,
    ...typedFields(form),
  };

  const ref = await addDoc(offersRef(), payload);

  if (form.localImageUri) {
    image = await uploadOfferImage(restaurantId, ref.id, form.localImageUri);
    await updateDoc(ref, { image });
  }

  return mapOffer(ref.id, { ...payload, image });
}

export async function updateOffer(
  restaurantId: string,
  offerId: string,
  form: OfferFormData
): Promise<void> {
  let image = normalizeImageUrl(form.image) ?? '';

  if (form.localImageUri) {
    image = await uploadOfferImage(restaurantId, offerId, form.localImageUri);
  }

  await updateDoc(offerDoc(offerId), {
    badge: form.badge.trim(),
    title: form.title.trim(),
    description: form.description.trim(),
    image,
    isActive: form.isActive,
    ...typedFields(form),
  });
}

export async function deleteOffer(offerId: string): Promise<void> {
  await deleteDoc(offerDoc(offerId));
}

export async function setOfferActive(
  offerId: string,
  isActive: boolean
): Promise<void> {
  await updateDoc(offerDoc(offerId), { isActive });
}

export function offerToFormData(offer: Offer): OfferFormData {
  return {
    type: offer.type ?? 'banner',
    badge: offer.badge,
    title: offer.title,
    description: offer.description,
    image: offer.image,
    couponCode: offer.couponCode ?? '',
    productId: offer.productId ?? '',
    discountKind: offer.discountKind ?? '',
    discountPercent:
      offer.discountPercent != null ? String(offer.discountPercent) : '',
    startsAt: toDateInput(offer.startsAt),
    endsAt: toDateInput(offer.endsAt),
    isActive: offer.isActive,
  };
}
