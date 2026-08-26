/**
 * utils/stats.ts
 * Estadísticas del repartidor a partir de sus pedidos. Función pura.
 * El ingreso del repartidor por pedido = tarifa de reparto (deliveryFee).
 */
import type { Order } from '../types/order';
import { ORDER_STATUS } from './constants';
import { toDate } from './format';

export interface DriverStats {
  todayCount: number;
  todayEarnings: number;
  weekCount: number;
  weekEarnings: number;
  totalCount: number;
  totalEarnings: number;
  activeCount: number;
  avgPerDelivery: number;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function computeStats(orders: Order[], now = new Date()): DriverStats {
  const active = new Set<string>([
    ORDER_STATUS.READY,
    ORDER_STATUS.ON_THE_WAY,
  ]);
  let stats: DriverStats = {
    todayCount: 0,
    todayEarnings: 0,
    weekCount: 0,
    weekEarnings: 0,
    totalCount: 0,
    totalEarnings: 0,
    activeCount: 0,
    avgPerDelivery: 0,
  };

  for (const o of orders) {
    if (active.has(o.status)) stats.activeCount += 1;
    if (o.status !== ORDER_STATUS.DELIVERED) continue;

    const fee = o.deliveryFee || 0;
    stats.totalCount += 1;
    stats.totalEarnings += fee;

    const d = toDate(o.deliveredAt);
    if (d) {
      if (isSameDay(d, now)) {
        stats.todayCount += 1;
        stats.todayEarnings += fee;
      }
      if (now.getTime() - d.getTime() <= WEEK_MS) {
        stats.weekCount += 1;
        stats.weekEarnings += fee;
      }
    }
  }

  stats.avgPerDelivery =
    stats.totalCount > 0 ? stats.totalEarnings / stats.totalCount : 0;
  return stats;
}
