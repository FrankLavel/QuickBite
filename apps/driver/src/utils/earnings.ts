/**
 * utils/earnings.ts
 * Ganancia del repartidor y liquidación con la plataforma. Funciones puras.
 *
 * Ganancia por entrega = tarifa fija (DRIVER_FEE_PER_DELIVERY) + propina del pedido.
 * Liquidación (manual, solo tarjeta): la plataforma le debe al repartidor la
 * ganancia de sus pedidos con TARJETA aún no liquidados. En efectivo el repartidor
 * ya cobró en mano; el "efectivo a remitir" es informativo (no entra al neto).
 */
import type { Order } from '../types/order';
import { DRIVER_FEE_PER_DELIVERY } from './constants';

/** Lo que gana el repartidor por un pedido: tarifa fija + propina. */
export function deliveryEarning(o: Pick<Order, 'tip'>): number {
  return DRIVER_FEE_PER_DELIVERY + (o.tip || 0);
}

export interface Settlement {
  /** Ganancia de pedidos con tarjeta aún no liquidados (la plataforma le debe). */
  owedCard: number;
  /** Nº de pedidos con tarjeta pendientes de liquidar. */
  owedCount: number;
  /** Efectivo cobrado que el repartidor debe remitir (informativo). */
  cashToRemit: number;
  /** Ids de los pedidos con tarjeta pendientes (para marcarlos liquidados). */
  pendingIds: string[];
}

function isDelivered(o: Order): boolean {
  return o.status === 'delivered';
}

/** Calcula la liquidación pendiente del repartidor a partir de sus pedidos. */
export function computeSettlement(orders: Order[]): Settlement {
  let owedCard = 0;
  let owedCount = 0;
  let cashToRemit = 0;
  const pendingIds: string[] = [];

  for (const o of orders) {
    if (!isDelivered(o)) continue;
    if (o.paymentMethod === 'cash') {
      // El repartidor cobró (total + propina) y se queda su ganancia; remite el resto.
      cashToRemit += Math.max(0, o.total - DRIVER_FEE_PER_DELIVERY);
    } else if (!o.driverSettledAt) {
      owedCard += deliveryEarning(o);
      owedCount += 1;
      pendingIds.push(o.id);
    }
  }

  return { owedCard, owedCount, cashToRemit, pendingIds };
}
