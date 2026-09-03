/**
 * Tests de utils/earnings.ts — ganancia por entrega y liquidación (solo tarjeta).
 */
import { deliveryEarning, computeSettlement } from '../earnings';
import type { Order } from '../../types/order';

function makeOrder(o: Partial<Order>): Order {
  return {
    id: Math.random().toString(36).slice(2),
    customerId: 'c1',
    restaurantId: 'r1',
    status: 'delivered',
    items: [],
    subtotal: 0,
    deliveryFee: 0,
    discount: 0,
    total: 0,
    deliveryAddress: { street: '', city: '' },
    paymentMethod: 'card',
    paymentStatus: 'paid',
    ...o,
  };
}

describe('deliveryEarning', () => {
  it('es tarifa fija ($30) + propina', () => {
    expect(deliveryEarning({ tip: 10 })).toBe(40);
    expect(deliveryEarning({ tip: undefined })).toBe(30);
    expect(deliveryEarning({})).toBe(30);
  });
});

describe('computeSettlement', () => {
  it('le deben las entregas con tarjeta no liquidadas; el efectivo es a remitir', () => {
    const paidCard = makeOrder({ paymentMethod: 'card', tip: 10 }); // debe 40
    const settledCard = makeOrder({
      paymentMethod: 'card',
      tip: 5,
      driverSettledAt: new Date(),
    }); // ya liquidado -> no cuenta
    const cash = makeOrder({ paymentMethod: 'cash', total: 150 }); // remitir 120
    const active = makeOrder({ status: 'on_the_way', paymentMethod: 'card', tip: 99 });

    const s = computeSettlement([paidCard, settledCard, cash, active]);
    expect(s.owedCard).toBe(40);
    expect(s.owedCount).toBe(1);
    expect(s.pendingIds).toEqual([paidCard.id]);
    expect(s.cashToRemit).toBe(120);
  });

  it('sin entregas devuelve ceros', () => {
    const s = computeSettlement([]);
    expect(s).toEqual({ owedCard: 0, owedCount: 0, cashToRemit: 0, pendingIds: [] });
  });
});
