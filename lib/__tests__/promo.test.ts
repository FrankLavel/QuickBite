/**
 * Tests de lib/promo.ts — descuentos de oferta de platillo (percent / 2x1),
 * subtotal de línea y total del carrito.
 */
jest.mock('firebase/firestore', () => ({ Timestamp: {} }));

import {
  round2,
  lineSubtotal,
  cartTotal,
  offerPromoFor,
  promoLabel,
} from '../promo';
import type { CartItemType } from '@/types/order.types';
import type { Offer } from '@/types/offer.types';

function item(o: Partial<CartItemType>): CartItemType {
  return {
    id: 'l1',
    productId: 'p1',
    name: 'Taco',
    price: 10,
    quantity: 1,
    ...o,
  } as CartItemType;
}

describe('round2', () => {
  it('redondea a dos decimales y corrige el ruido de coma flotante', () => {
    expect(round2(5)).toBe(5);
    expect(round2(1.2)).toBe(1.2);
    expect(round2(1.999)).toBe(2);
    expect(round2(0.1 + 0.2)).toBe(0.3); // 0.30000000000000004 -> 0.3
  });
});

describe('lineSubtotal', () => {
  it('sin promo es precio × cantidad', () => {
    expect(lineSubtotal(item({ price: 10, quantity: 3 }))).toBe(30);
  });
  it('percent aplica el descuento (y 100% = gratis)', () => {
    expect(lineSubtotal(item({ price: 10, quantity: 2, promo: { kind: 'percent', percent: 50 } }))).toBe(10);
    expect(lineSubtotal(item({ price: 10, quantity: 2, promo: { kind: 'percent', percent: 100 } }))).toBe(0);
  });
  it('percent fuera de rango se recorta a [0,100]', () => {
    expect(lineSubtotal(item({ price: 10, quantity: 1, promo: { kind: 'percent', percent: 150 } }))).toBe(0);
  });
  it('2x1 cobra ceil(cantidad/2) unidades', () => {
    expect(lineSubtotal(item({ price: 10, quantity: 3, promo: { kind: '2x1' } }))).toBe(20);
    expect(lineSubtotal(item({ price: 10, quantity: 4, promo: { kind: '2x1' } }))).toBe(20);
  });
});

describe('cartTotal', () => {
  it('suma los subtotales redondeados por línea', () => {
    const items = [
      item({ price: 10, quantity: 2 }), // 20
      item({ price: 15, quantity: 2, promo: { kind: '2x1' } }), // 15
    ];
    expect(cartTotal(items)).toBe(35);
  });
});

describe('offerPromoFor', () => {
  const offers = [
    { type: 'dish', restaurantId: 'r1', productId: 'p1', discountKind: 'percent', discountPercent: 20 },
    { type: 'dish', restaurantId: 'r1', productId: 'p2', discountKind: '2x1' },
  ] as unknown as Offer[];

  it('encuentra la promo del platillo', () => {
    expect(offerPromoFor(offers, 'r1', 'p1')).toEqual({ kind: 'percent', percent: 20 });
    expect(offerPromoFor(offers, 'r1', 'p2')).toEqual({ kind: '2x1' });
  });
  it('devuelve null si no hay oferta para ese platillo', () => {
    expect(offerPromoFor(offers, 'r1', 'zzz')).toBeNull();
  });
});

describe('promoLabel', () => {
  it('formatea la etiqueta', () => {
    expect(promoLabel({ kind: '2x1' })).toBe('2x1');
    expect(promoLabel({ kind: 'percent', percent: 100 })).toBe('GRATIS');
    expect(promoLabel({ kind: 'percent', percent: 15 })).toBe('-15%');
  });
});
