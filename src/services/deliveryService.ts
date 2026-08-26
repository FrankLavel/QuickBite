/**
 * services/deliveryService.ts
 * Lógica de reparto en modelo "auto-servicio": el repartidor ve una proyección
 * REDACTADA de los pedidos disponibles (availableOrders, sin PII del cliente),
 * reclama uno, y solo entonces lee el pedido completo para recogerlo/entregarlo.
 */
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, ORDER_STATUS } from '../utils/constants';
import type { Order } from '../types/order';
import type { AvailableOrder } from '../types/availableOrder';
import type { DriverUser } from '../types/user';

function mapOrder(id: string, data: Record<string, unknown>): Order {
  return { id, ...(data as Omit<Order, 'id'>) };
}

/**
 * Escucha en tiempo real los pedidos disponibles (proyección redactada sin PII).
 * La colección solo contiene pedidos 'ready' sin repartidor (la mantiene una
 * Cloud Function), así que no hace falta filtrar en cliente.
 */
export function listenAvailableOrders(
  cb: (orders: AvailableOrder[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.AVAILABLE_ORDERS), (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as AvailableOrder), orderId: d.id })));
  });
}

/** Escucha en tiempo real los pedidos asignados a este repartidor (activos + historial). */
export function listenMyOrders(
  uid: string,
  cb: (orders: Order[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    where('driverId', '==', uid)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => mapOrder(d.id, d.data())));
  });
}

const ACTIVE = new Set<string>([ORDER_STATUS.READY, ORDER_STATUS.ON_THE_WAY]);

export function isActiveDelivery(o: Order): boolean {
  return ACTIVE.has(o.status);
}

/**
 * Reclama un pedido disponible. Escribe solo driverId+assignedAt: la regla de
 * Firestore exige que el pedido siga 'ready' y sin repartidor, así que si dos
 * repartidores compiten, el segundo recibe permission-denied (no hace falta
 * transacción ni leer el pedido, que aún no puede ver). El nombre/teléfono los
 * denormaliza una Cloud Function desde el perfil real del repartidor.
 */
export async function claimOrder(
  orderId: string,
  driver: DriverUser
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
      driverId: driver.uid,
      assignedAt: serverTimestamp(),
    });
  } catch {
    throw new Error('Otro repartidor tomó este pedido.');
  }
}

/** Marca el pedido como recogido: 'ready' → 'on_the_way'. */
export async function pickUpOrder(orderId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
    status: ORDER_STATUS.ON_THE_WAY,
    pickedUpAt: serverTimestamp(),
  });
}

/** Marca el pedido como entregado: 'on_the_way' → 'delivered'. */
export async function markDelivered(orderId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
    status: ORDER_STATUS.DELIVERED,
    deliveredAt: serverTimestamp(),
  });
}

/** Escucha en tiempo real un pedido concreto (para la pantalla de detalle). */
export function listenOrder(
  orderId: string,
  cb: (order: Order | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.ORDERS, orderId), (snap) => {
    cb(snap.exists() ? mapOrder(snap.id, snap.data()) : null);
  });
}

export interface RestaurantInfo {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
}

/** Datos del restaurante para el punto de recogida (incluye coordenadas). */
export async function getRestaurantInfo(
  restId: string
): Promise<RestaurantInfo | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.RESTAURANTS, restId));
  if (!snap.exists()) return null;
  const data = snap.data();
  // location es un GeoPoint de Firestore ({ latitude, longitude }).
  const loc = data.location as
    | { latitude?: number; longitude?: number }
    | undefined;
  return {
    name: (data.name as string) ?? 'Restaurante',
    address: data.address as string | undefined,
    lat: loc?.latitude,
    lng: loc?.longitude,
  };
}
