/**
 * types/tracking.ts
 * deliveryTracking/{orderId} — ubicación en vivo del repartidor durante una
 * entrega en camino. La escribe la app QuickBite Driver; se borra al entregar.
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
