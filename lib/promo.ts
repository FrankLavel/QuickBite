/**
 * promo.ts
 * Descuentos de ofertas de platillo aplicados a las líneas del carrito.
 *
 * Una oferta type='dish' puede traer un descuento (`discountKind`): 'percent'
 * (N% off, 100 = gratis) o '2x1' (paga 1 de cada 2). Ese descuento se guarda
 * como `promo` en la línea del carrito y se refleja en el subtotal de la línea,
 * en el total del carrito y en el precio unitario que se envía al cobro.
 */

import type { CartItemType, LinePromo } from '@/types/order.types';
import type { Offer } from '@/types/offer.types';

export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Subtotal EXACTO de una línea aplicando su promo (si tiene). */
export function lineSubtotal(
  item: Pick<CartItemType, 'price' | 'quantity' | 'promo'>
): number {
  const base = item.price * item.quantity;
  const promo = item.promo;
  if (!promo) return base;
  if (promo.kind === 'percent') {
    const pct = Math.min(Math.max(promo.percent, 0), 100);
    return base * (1 - pct / 100);
  }
  // 2x1: el impar se cobra completo → se pagan ceil(qty/2) unidades.
  return item.price * Math.ceil(item.quantity / 2);
}

/** Total del carrito con promos, redondeado por línea (igual que el servidor). */
export function cartTotal(items: CartItemType[]): number {
  return items.reduce((sum, i) => sum + round2(lineSubtotal(i)), 0);
}

/**
 * Promo de la oferta de platillo ACTIVA para este producto (o null). `offers` ya
 * viene filtrado a activas + vigentes (useOffers).
 */
export function offerPromoFor(
  offers: Offer[],
  restaurantId: string,
  productId: string
): LinePromo | null {
  const offer = offers.find(
    (o) =>
      o.type === 'dish' &&
      o.restaurantId === restaurantId &&
      o.productId === productId &&
      !!o.discountKind
  );
  if (!offer) return null;
  if (offer.discountKind === '2x1') return { kind: '2x1' };
  if (offer.discountKind === 'percent' && (offer.discountPercent ?? 0) > 0) {
    return { kind: 'percent', percent: offer.discountPercent as number };
  }
  return null;
}

/** Etiqueta corta para la UI: "2x1", "GRATIS", "-15%". */
export function promoLabel(promo: LinePromo): string {
  if (promo.kind === '2x1') return '2x1';
  return promo.percent >= 100 ? 'GRATIS' : `-${promo.percent}%`;
}
