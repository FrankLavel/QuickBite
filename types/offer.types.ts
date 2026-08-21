import { Timestamp } from 'firebase/firestore';

/**
 * Documento /offers/{offerId}. Promociones que la app muestra en el Home.
 * Solo lectura desde la app móvil.
 *
 * Tipos: 'banner' (abre el restaurante), 'coupon' (sugiere un cupón),
 * 'dish' (abre un platillo del menú). Ofertas viejas sin `type` = 'banner'.
 */
export type OfferType = 'banner' | 'coupon' | 'dish';

export interface Offer {
  id: string;
  restaurantId: string;
  /** Ofertas viejas sin campo se tratan como 'banner'. */
  type?: OfferType;
  /** Etiqueta corta: "FLASH SALE", "2x1", "Envío gratis"... */
  badge: string;
  title: string;
  description: string;
  /** URL pública de la imagen de la oferta. */
  image: string;
  /** Código de cupón sugerido (type='coupon'). */
  couponCode?: string;
  /** Platillo vinculado (type='dish'); abre /product/{productId}. */
  productId?: string;
  /** Descuento de la oferta de platillo: 'percent' (N%) o '2x1'. */
  discountKind?: 'percent' | '2x1';
  /** Porcentaje de descuento cuando discountKind='percent' (0-100, 100=gratis). */
  discountPercent?: number;
  /** Ventana de vigencia (opcional). Fuera de ella la oferta no se muestra. */
  startsAt?: Timestamp | null;
  endsAt?: Timestamp | null;
  isActive: boolean;
}
