/**
 * Documento /offers/{offerId}. Banners promocionales que la app muestra en el
 * Home. Cada oferta apunta a un restaurante y, opcionalmente, sugiere un cupón.
 * Solo lectura desde la app móvil.
 */
export interface Offer {
  id: string;
  restaurantId: string;
  /** Etiqueta corta: "FLASH SALE", "2x1", "Envío gratis"... */
  badge: string;
  title: string;
  description: string;
  /** URL pública de la imagen de la oferta. */
  image: string;
  /** Código de cupón sugerido (opcional). */
  couponCode?: string;
  isActive: boolean;
}
