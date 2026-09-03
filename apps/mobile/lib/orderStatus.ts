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

// Mensaje que ve el cliente por estado: fuente de verdad en @quickbite/shared
// (lo comparten la app y las Cloud Functions). Se re-exporta para no cambiar los
// imports existentes (F5).
export { ORDER_STATUS_MESSAGE } from '@quickbite/shared';

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
