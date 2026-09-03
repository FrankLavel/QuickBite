/**
 * Tests de utils/stats.ts — estadísticas del repartidor (ingreso = deliveryFee).
 */
import { computeStats } from '../stats';
import type { Order } from '../../types/order';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2030, 5, 15, 12, 0, 0);

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
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    ...o,
  };
}

describe('computeStats', () => {
  it('devuelve ceros sin pedidos', () => {
    expect(computeStats([], NOW)).toEqual({
      todayCount: 0,
      todayEarnings: 0,
      weekCount: 0,
      weekEarnings: 0,
      totalCount: 0,
      totalEarnings: 0,
      activeCount: 0,
      avgPerDelivery: 0,
    });
  });

  it('agrega ganancias (tarifa fija $30 + propina) y separa hoy/semana/total y activas', () => {
    const orders: Order[] = [
      makeOrder({ status: 'delivered', tip: 10, deliveredAt: new Date(NOW) }), // 40
      makeOrder({ status: 'delivered', tip: 0, deliveredAt: new Date(NOW.getTime() - 3 * DAY) }), // 30
      makeOrder({ status: 'delivered', tip: 5, deliveredAt: new Date(NOW.getTime() - 10 * DAY) }), // 35
      makeOrder({ status: 'on_the_way', driverId: 'd1' }),
      makeOrder({ status: 'ready', driverId: 'd1' }),
    ];
    const s = computeStats(orders, NOW);
    expect(s.totalCount).toBe(3);
    expect(s.totalEarnings).toBe(105); // 40 + 30 + 35
    expect(s.todayCount).toBe(1);
    expect(s.todayEarnings).toBe(40);
    expect(s.weekCount).toBe(2); // hoy + hace 3 días
    expect(s.weekEarnings).toBe(70); // 40 + 30
    expect(s.activeCount).toBe(2);
    expect(s.avgPerDelivery).toBe(35);
  });
});
