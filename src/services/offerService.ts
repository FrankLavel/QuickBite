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
} from 'firebase/firestore';
import { db } from './firebase';
import { uploadOfferImage } from './storageService';
import { COLLECTIONS } from '../utils/constants';
import { normalizeImageUrl } from '../utils/imageUrl';
import type { Offer, OfferFormData } from '../types/offer';

function offersRef() {
  return collection(db, COLLECTIONS.OFFERS);
}

function offerDoc(offerId: string) {
  return doc(db, COLLECTIONS.OFFERS, offerId);
}

function mapOffer(id: string, data: Record<string, unknown>): Offer {
  return {
    id,
    restaurantId: (data.restaurantId as string) ?? '',
    badge: (data.badge as string) ?? '',
    title: (data.title as string) ?? '',
    description: (data.description as string) ?? '',
    image: normalizeImageUrl(data.image as string) ?? '',
    couponCode: (data.couponCode as string) || undefined,
    isActive: data.isActive !== false,
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
    couponCode: form.couponCode.trim() || null,
    isActive: form.isActive,
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
    couponCode: form.couponCode.trim() || null,
    isActive: form.isActive,
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
    badge: offer.badge,
    title: offer.title,
    description: offer.description,
    image: offer.image,
    couponCode: offer.couponCode ?? '',
    isActive: offer.isActive,
  };
}
