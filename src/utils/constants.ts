/**
 * utils/constants.ts
 * Colecciones y estados compartidos con el resto del ecosistema QuickBite.
 * Proyecto Firebase: quickbite-6dee7.
 */

export const COLLECTIONS = {
  USERS: 'users',
  RESTAURANTS: 'restaurants',
  ORDERS: 'orders',
} as const;

export const STORAGE_KEYS = {
  AUTH_USER: 'quickbite_driver_auth_user',
} as const;

/** Estados de pedido (orders.status) — mismo contrato que las otras apps. */
export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  preparing: 'En cocina',
  ready: 'Listo para recoger',
  on_the_way: 'En camino',
  delivered: 'Entregado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
};
