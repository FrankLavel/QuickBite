/**
 * types/notification.ts
 * Subcolección users/{uid}/notifications/{notifId}
 */

export type NotificationType = 'order_update' | 'promo' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  orderId?: string;
  isRead: boolean;
  createdAt?: unknown;
}
