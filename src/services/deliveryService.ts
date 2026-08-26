/**
 * services/deliveryService.ts
 * Lógica de reparto en modelo "auto-servicio": el repartidor ve los pedidos
 * 'ready' sin repartidor, reclama uno (transacción para evitar doble asignación),
 * lo recoge y lo marca como entregado.
 */
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, ORDER_STATUS } from '../utils/constants';
import type { Order } from '../types/order';
import type { DriverUser } from '../types/user';

function mapOrder(id: string, data: Record<string, unknown>): Order {
  return { id, ...(data as Omit<Order, 'id'>) };
}

/** ¿El pedido está libre para reclamar? (ready y sin repartidor). */
export function isAvailable(o: Order): boolean {
  return o.status === ORDER_STATUS.READY && !o.driverId;
}

/**
 * Escucha en tiempo real los pedidos 'ready'. Filtra en cliente los que ya tienen
 * repartidor (Firestore no consulta bien la ausencia de un campo).
 */
export function listenAvailableOrders(
  cb: (orders: Order[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    where('status', '==', ORDER_STATUS.READY)
  );
  return onSnapshot(q, (snap) => {
    const orders = snap.docs
      .map((d) => mapOrder(d.id, d.data()))
      .filter(isAvailable);
    cb(orders);
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
 * Reclama un pedido disponible. Usa una transacción: relee el pedido y solo asigna
 * si sigue 'ready' y sin repartidor, evitando que dos repartidores lo tomen a la vez.
 */
export async function claimOrder(
  orderId: string,
  driver: DriverUser
): Promise<void> {
  const ref = doc(db, COLLECTIONS.ORDERS, orderId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('El pedido ya no existe.');
    const data = snap.data() as Order;
    if (data.status !== ORDER_STATUS.READY || data.driverId) {
      throw new Error('Otro repartidor tomó este pedido.');
    }
    tx.update(ref, {
      driverId: driver.uid,
      driverName: driver.name,
      driverPhone: driver.phone ?? '',
      assignedAt: serverTimestamp(),
    });
  });
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
