/**
 * types/offer.ts
 * Colección offers/{offerId} — promociones en el Home móvil (PDF).
 *
 * Una oferta puede ser de 3 tipos:
 *  - 'banner': solo tarjeta promocional; al tocarla abre el restaurante.
 *  - 'coupon': banner + cupón vinculado (se sugiere aplicar el cupón).
 *  - 'dish':   banner ligado a un platillo existente; al tocarla abre ese platillo.
 */

export type OfferType = 'banner' | 'coupon' | 'dish';

export interface Offer {
  id: string;
  restaurantId: string;
  /** Tipo de oferta. Ofertas viejas sin campo se tratan como 'banner'. */
  type: OfferType;
  badge: string;
  title: string;
  description: string;
  image: string;
  /** Cupón sugerido vinculado (FK -> coupons/{code}). Solo si type='coupon'. */
  couponCode?: string;
  /** Platillo vinculado (FK -> restaurants/{rid}/products/{pid}). Solo si type='dish'. */
  productId?: string;
  /** Descuento del platillo en promo: 'percent' (N%) o '2x1'. Solo type='dish'. */
  discountKind?: 'percent' | '2x1';
  /** Porcentaje cuando discountKind='percent' (0-100, 100=gratis). */
  discountPercent?: number;
  /** Ventana de vigencia (opcional). Fuera de ella el banner no se muestra. */
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive: boolean;
}

export interface OfferFormData {
  type: OfferType;
  badge: string;
  title: string;
  description: string;
  image: string;
  couponCode: string;
  /** Id del platillo vinculado (type='dish'). */
  productId: string;
  /** '' = sin descuento; 'percent' = %; '2x1'. */
  discountKind: '' | 'percent' | '2x1';
  /** Porcentaje como texto (type='dish' + discountKind='percent'). */
  discountPercent: string;
  /** Fechas en formato YYYY-MM-DD (vacío = sin límite). */
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  localImageUri?: string;
}
