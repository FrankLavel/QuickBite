/**
 * services/trackingService.ts
 * Lee en tiempo real la ubicación del repartidor (deliveryTracking/{orderId}).
 */
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type { DeliveryTracking } from '../types/tracking';

const COLLECTION = 'deliveryTracking';

/** Suscripción en tiempo real a la ubicación del repartidor de un pedido. */
export function listenTracking(
  orderId: string,
  cb: (tracking: DeliveryTracking | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, COLLECTION, orderId),
    (snap) => cb(snap.exists() ? (snap.data() as DeliveryTracking) : null),
    () => cb(null)
  );
}
