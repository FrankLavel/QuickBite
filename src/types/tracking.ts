/**
 * types/tracking.ts
 * deliveryTracking/{orderId} — ubicación en vivo del repartidor durante una
 * entrega. Existe solo mientras el pedido está en camino; se borra al entregar.
 */
export interface DeliveryTracking {
  orderId: string;
  driverId: string;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  updatedAt?: unknown;
}
