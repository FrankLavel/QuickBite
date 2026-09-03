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
  writeBatch,
  serverTimestamp,
  deleteField,
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
    customerName: data.customerName as string | undefined,
    customerPhone: data.customerPhone as string | undefined,
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
    paymentProvider: data.paymentProvider as Order['paymentProvider'],
    openpayChargeId: data.openpayChargeId as string | undefined,
    cardBrand: (data.cardBrand as string | null) ?? null,
    cardLast4: (data.cardLast4 as string | null) ?? null,
    paidAt: data.paidAt,
    refundedAt: data.refundedAt,
    settledAt: data.settledAt,
    couponCode: (data.couponCode as string | null) ?? null,
    specialInstructions: data.specialInstructions as string | undefined,
    rejectionReason: data.rejectionReason as string | undefined,
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

/**
 * Marca uno o más pedidos como liquidados (la plataforma ya le pagó al
 * restaurante). Estampa settledAt = serverTimestamp en un batch atómico.
 * Firestore rechaza lotes de más de 500 escrituras; se parte en tandas.
 */
export async function markOrdersSettled(orderIds: string[]): Promise<void> {
  const CHUNK = 450;
  for (let i = 0; i < orderIds.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const id of orderIds.slice(i, i + CHUNK)) {
      batch.update(doc(db, COLLECTIONS.ORDERS, id), {
        settledAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
}

/** Deshace la liquidación de uno o más pedidos (quita settledAt). */
export async function unmarkOrdersSettled(orderIds: string[]): Promise<void> {
  const CHUNK = 450;
  for (let i = 0; i < orderIds.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const id of orderIds.slice(i, i + CHUNK)) {
      batch.update(doc(db, COLLECTIONS.ORDERS, id), {
        settledAt: deleteField(),
      });
    }
    await batch.commit();
  }
}

/** Actualiza status y/o estimatedTime (permisos del restaurante). Al rechazar,
 *  guarda el motivo para que el cliente lo vea. */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  estimatedTime?: number,
  rejectionReason?: string
): Promise<void> {
  const payload: {
    status: OrderStatus;
    estimatedTime?: number;
    rejectionReason?: string;
    acceptedAt?: ReturnType<typeof Timestamp.now>;
    deliveredAt?: ReturnType<typeof Timestamp.now>;
  } = { status };

  if (estimatedTime !== undefined) {
    payload.estimatedTime = estimatedTime;
  }
  if (status === ORDER_STATUS.REJECTED && rejectionReason?.trim()) {
    payload.rejectionReason = rejectionReason.trim();
  }

  if (status === ORDER_STATUS.ACCEPTED) {
    payload.acceptedAt = Timestamp.now();
  }
  if (status === ORDER_STATUS.DELIVERED) {
    payload.deliveredAt = Timestamp.now();
  }

  await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), payload);
}
