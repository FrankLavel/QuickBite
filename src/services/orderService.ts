/**
 * services/orderService.ts
 * Colección orders/{orderId}
 * El restaurante solo puede leer sus pedidos y editar status / estimatedTime.
 */

import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, ORDER_STATUS } from '../utils/constants';
import type { Order, OrderStatus } from '../types/order';

function mapOrder(id: string, data: Record<string, unknown>): Order {
  return {
    id,
    customerId: (data.customerId as string) ?? '',
    restaurantId: (data.restaurantId as string) ?? '',
    status: (data.status as OrderStatus) ?? ORDER_STATUS.PENDING,
    items: (data.items as Order['items']) ?? [],
    subtotal: Number(data.subtotal) || 0,
    deliveryFee: Number(data.deliveryFee) || 0,
    discount: Number(data.discount) || 0,
    total: Number(data.total) || 0,
    deliveryAddress: (data.deliveryAddress as Order['deliveryAddress']) ?? {
      street: '',
      city: '',
    },
    paymentMethod: (data.paymentMethod as Order['paymentMethod']) ?? 'cash',
    paymentStatus: (data.paymentStatus as Order['paymentStatus']) ?? 'pending',
    couponCode: (data.couponCode as string | null) ?? null,
    specialInstructions: data.specialInstructions as string | undefined,
    estimatedTime: data.estimatedTime as number | undefined,
    rating: data.rating as number | undefined,
    createdAt: data.createdAt,
    acceptedAt: data.acceptedAt,
    deliveredAt: data.deliveredAt,
  };
}

export async function getRestaurantOrders(
  restaurantId: string
): Promise<Order[]> {
  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapOrder(d.id, d.data()));
}

/**
 * Escucha en tiempo real los pedidos del restaurante (onSnapshot).
 * Devuelve la función para cancelar la suscripción.
 * Requiere el índice compuesto orders(restaurantId ASC, createdAt DESC).
 */
export function listenRestaurantOrders(
  restaurantId: string,
  onData: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapOrder(d.id, d.data()))),
    (error) => onError?.(error)
  );
}

/** Actualiza solo status y/o estimatedTime (permisos del restaurante) */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  estimatedTime?: number
): Promise<void> {
  const payload: {
    status: OrderStatus;
    estimatedTime?: number;
    acceptedAt?: ReturnType<typeof Timestamp.now>;
    deliveredAt?: ReturnType<typeof Timestamp.now>;
  } = { status };

  if (estimatedTime !== undefined) {
    payload.estimatedTime = estimatedTime;
  }

  if (status === ORDER_STATUS.ACCEPTED) {
    payload.acceptedAt = Timestamp.now();
  }
  if (status === ORDER_STATUS.DELIVERED) {
    payload.deliveredAt = Timestamp.now();
  }

  await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), payload);
}
