import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { DeliveryTracking, Order } from '@/types/order.types';

const ordersCol = () => collection(db, 'orders');
const orderRef = (orderId: string) => doc(db, 'orders', orderId);

/** Estados en los que el pedido se considera activo (en curso). */
const ACTIVE_STATUSES: Order['status'][] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'on_the_way',
];

export const ordersService = {
  // Nota: los pedidos ya NO se crean desde el cliente. Los crea Cloud Functions
  // (Admin SDK) recalculando montos en el servidor: tarjeta -> createCardCharge,
  // efectivo -> createCashOrder (ver services/payments.service.ts). Las reglas de
  // `orders` (create) y `coupons` (update) están cerradas al cliente (F2/F3).

  getById: async (orderId: string): Promise<Order | null> => {
    const snap = await getDoc(orderRef(orderId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null;
  },

  /**
   * Orders History: pedidos del cliente, más reciente primero.
   * Filtra por customerId en la query y ordena en cliente (sin índice compuesto).
   */
  getMyOrders: async (customerId: string): Promise<Order[]> => {
    const q = query(ordersCol(), where('customerId', '==', customerId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Order))
      .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  },

  /** Igual que getMyOrders pero en tiempo real (se actualiza al cambiar el estado). */
  listenMyOrders: (customerId: string, onChange: (orders: Order[]) => void): Unsubscribe => {
    const q = query(ordersCol(), where('customerId', '==', customerId));
    return onSnapshot(q, (snap) => {
      const orders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Order))
        .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      onChange(orders);
    });
  },

  /** Pedidos activos (en curso) del cliente. */
  getActiveOrders: async (customerId: string): Promise<Order[]> => {
    const q = query(ordersCol(), where('customerId', '==', customerId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Order))
      .filter((o) => ACTIVE_STATUSES.includes(o.status));
  },

  /**
   * Compra verificada para reseñas: devuelve el id del pedido 'delivered' más
   * reciente del cliente que incluye este producto, o null si no lo ha comprado.
   */
  deliveredOrderIdForProduct: async (
    customerId: string,
    restaurantId: string,
    productId: string
  ): Promise<string | null> => {
    const q = query(ordersCol(), where('customerId', '==', customerId));
    const snap = await getDocs(q);
    const match = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Order))
      .filter(
        (o) =>
          o.status === 'delivered' &&
          o.restaurantId === restaurantId &&
          o.items.some((i) => i.productId === productId)
      )
      .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
    return match[0]?.id ?? null;
  },

  /** Escucha un pedido concreto en tiempo real (Order Confirmation / tracking). */
  listenOrder: (
    orderId: string,
    onChange: (order: Order | null) => void
  ): Unsubscribe =>
    onSnapshot(orderRef(orderId), (snap) =>
      onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null)
    ),

  /** Escucha la ubicación en vivo del repartidor (deliveryTracking/{orderId}). */
  listenTracking: (
    orderId: string,
    onChange: (tracking: DeliveryTracking | null) => void
  ): Unsubscribe =>
    onSnapshot(doc(db, 'deliveryTracking', orderId), (snap) =>
      onChange(snap.exists() ? (snap.data() as DeliveryTracking) : null)
    ),

  /** Única escritura de UPDATE permitida al cliente: la calificación. */
  addRating: (orderId: string, rating: number) =>
    updateDoc(orderRef(orderId), { rating }),

  /**
   * Cancela el pedido. Las Security Rules solo lo permiten mientras está en
   * 'pending' (antes de que el restaurante lo acepte); si ya avanzó, la
   * escritura es rechazada por Firestore.
   */
  cancelOrder: (orderId: string) =>
    updateDoc(orderRef(orderId), {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
    }),
};
