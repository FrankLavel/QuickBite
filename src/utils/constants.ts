/**
 * utils/constants.ts
 * Colecciones y estados compartidos con el resto del ecosistema QuickBite.
 * Proyecto Firebase: quickbite-6dee7.
 */

export const COLLECTIONS = {
  USERS: 'users',
  RESTAURANTS: 'restaurants',
  ORDERS: 'orders',
  /** Proyección redactada de pedidos disponibles (sin PII), para repartidores. */
  AVAILABLE_ORDERS: 'availableOrders',
} as const;

export const STORAGE_KEYS = {
  AUTH_USER: 'quickbite_driver_auth_user',
} as const;

/**
 * Lo que gana el repartidor por cada entrega: tarifa fija (MXN) + la propina del
 * pedido. Ajustable aquí. La liquidación con la plataforma es solo sobre pedidos
 * con tarjeta (en efectivo el repartidor ya cobró en mano).
 */
export const DRIVER_FEE_PER_DELIVERY = 30;

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
