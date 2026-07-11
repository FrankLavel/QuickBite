import { Timestamp } from 'firebase/firestore';

export type NotificationType = 'order_update' | 'promo' | 'system';

/**
 * Subcolección /users/{uid}/notifications/{notifId}.
 * Las crea Cloud Functions; el cliente solo lee y marca isRead = true.
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Referencia al pedido relacionado (solo para order_update). */
  orderId?: string;
  isRead: boolean;
  createdAt: Timestamp;
}
