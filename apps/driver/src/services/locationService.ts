/**
 * services/locationService.ts
 * Captura la ubicación del repartidor en PRIMER PLANO y la publica en
 * deliveryTracking/{orderId} mientras hay una entrega en camino.
 */
import * as Location from 'expo-location';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const TRACKING = 'deliveryTracking';

export type PermissionResult = 'granted' | 'denied';

/** Pide permiso de ubicación en primer plano. */
export async function requestForegroundPermission(): Promise<PermissionResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted' ? 'granted' : 'denied';
}

export interface LocationSharer {
  /** Detiene el envío de ubicación (no borra el doc de tracking). */
  stop: () => void;
}

/**
 * Empieza a compartir la ubicación para un pedido. Pide permiso; si se concede,
 * observa la posición y escribe cada actualización en deliveryTracking/{orderId}.
 * Devuelve null si el permiso fue denegado.
 */
export async function startSharingLocation(
  orderId: string,
  driverId: string,
  onError?: (e: unknown) => void
): Promise<LocationSharer | null> {
  if ((await requestForegroundPermission()) !== 'granted') return null;

  const sub = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000, // como mucho una escritura cada 5 s…
      distanceInterval: 20, // …o cada 20 m recorridos.
    },
    (pos) => {
      void setDoc(
        doc(db, TRACKING, orderId),
        {
          orderId,
          driverId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading ?? null,
          speed: pos.coords.speed ?? null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((e) => onError?.(e));
    }
  );

  return { stop: () => sub.remove() };
}

/** Borra el rastro de ubicación (al completar o cancelar la entrega). */
export async function clearTracking(orderId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, TRACKING, orderId));
  } catch {
    // Best-effort: si falla el borrado, el doc queda obsoleto pero inofensivo.
  }
}
