import { OrderStatus } from '@/types/order.types';
import { palette } from '@/constants/colors';

/** Etiqueta corta del estado. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  on_the_way: 'En camino',
  delivered: 'Entregado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
};

/** Mensaje que ve el cliente por estado (doc móvil). */
export const ORDER_STATUS_MESSAGE: Record<OrderStatus, string> = {
  pending: 'Tu pedido está siendo revisado...',
  accepted: 'Pedido confirmado, en preparación',
  preparing: 'Tu pedido está en cocina',
  ready: 'Tu pedido está listo para envío',
  on_the_way: 'Tu pedido está en camino',
  delivered: 'Pedido entregado — califica tu pedido',
  rejected: 'Tu pedido fue rechazado',
  cancelled: 'Cancelaste este pedido',
};

/** Color representativo por estado (del sistema de diseño). */
export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  pending: palette.star,
  accepted: palette.primary,
  preparing: palette.tertiary,
  ready: palette.secondary,
  on_the_way: palette.primary,
  delivered: palette.primary,
  rejected: palette.error,
  cancelled: palette.error,
};
