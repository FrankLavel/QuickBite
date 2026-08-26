/**
 * types/availableOrder.ts
 * availableOrders/{orderId} — proyección REDACTADA de un pedido disponible que ve
 * el repartidor ANTES de reclamarlo. No incluye PII del cliente (nombre, teléfono,
 * dirección exacta): solo datos gruesos para decidir si tomarlo.
 */
export interface AvailableOrder {
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  city: string;
  total: number;
  itemCount: number;
  orderCreatedAt?: unknown;
}
