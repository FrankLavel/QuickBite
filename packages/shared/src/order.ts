/**
 * Contrato de dominio del PEDIDO, compartido por la app cliente, el dashboard,
 * la app de repartidor y las Cloud Functions.
 *
 * Es la única fuente de verdad de los estados, el flujo y las transiciones. Las
 * transiciones definidas aquí DEBEN reflejar lo que hacen cumplir las Security
 * Rules (firestore.rules), que son la autoridad en el servidor.
 */

/** Todos los estados posibles de un pedido. */
export const ORDER_STATUSES = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'on_the_way',
  'delivered',
  'rejected',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type PaymentMethod = 'card' | 'paypal' | 'cash';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type PaymentProvider = 'openpay';

/** Flujo lineal "feliz" del pedido: cada paso avanza uno. */
export const ORDER_FLOW: readonly OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'on_the_way',
  'delivered',
];

/** El siguiente estado del flujo, o null si el estado es terminal. */
export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const i = ORDER_FLOW.indexOf(status);
  return i >= 0 && i < ORDER_FLOW.length - 1 ? ORDER_FLOW[i + 1] : null;
}

/**
 * Transiciones que puede hacer el RESTAURANTE. Debe coincidir con la función
 * `validRestaurantTransition` de firestore.rules (F4): avance de un paso, o
 * rechazo antes de salir a reparto.
 */
const RESTAURANT_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ['accepted', 'rejected'],
  accepted: ['preparing', 'rejected'],
  preparing: ['ready', 'rejected'],
  ready: ['on_the_way'],
  on_the_way: ['delivered'],
  delivered: [],
  rejected: [],
  cancelled: [],
};

export function canRestaurantTransition(from: OrderStatus, to: OrderStatus): boolean {
  return RESTAURANT_TRANSITIONS[from].includes(to);
}

/**
 * Transiciones que puede hacer el REPARTIDOR (modelo auto-servicio). Debe
 * coincidir con las ramas de repartidor de firestore.rules.
 */
export function canDriverTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (
    (from === 'ready' && to === 'on_the_way') ||
    (from === 'on_the_way' && to === 'delivered')
  );
}

/**
 * Mensaje orientado al cliente por cada estado. Compartido por la app (pantalla
 * de pedidos) y por las Cloud Functions (notificaciones push), que antes lo
 * duplicaban por separado.
 */
export const ORDER_STATUS_MESSAGE: Readonly<Record<OrderStatus, string>> = {
  pending: 'Tu pedido está siendo revisado...',
  accepted: 'Pedido confirmado, en preparación',
  preparing: 'Tu pedido está en cocina',
  ready: 'Tu pedido está listo para envío',
  on_the_way: 'Tu pedido está en camino',
  delivered: 'Pedido entregado — califica tu pedido',
  rejected: 'Tu pedido fue rechazado',
  cancelled: 'Cancelaste este pedido',
};
