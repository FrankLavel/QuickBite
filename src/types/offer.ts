/**
 * types/offer.ts
 * Colección offers/{offerId} — banners promocionales en el Home móvil (PDF).
 */

export interface Offer {
  id: string;
  restaurantId: string;
  badge: string;
  title: string;
  description: string;
  image: string;
  /** Cupón sugerido vinculado (FK -> coupons/{code}), opcional */
  couponCode?: string;
  isActive: boolean;
}

export interface OfferFormData {
  badge: string;
  title: string;
  description: string;
  image: string;
  couponCode: string;
  isActive: boolean;
  localImageUri?: string;
}
