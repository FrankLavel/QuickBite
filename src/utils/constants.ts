/**
 * constants.ts
 * Colecciones y rutas según QuickBite-Modelo-de-Datos-Dashboard.pdf
 * Proyecto Firebase: quickbite-6dee7
 */

import type { WeekDayKey } from '../types/restaurant';

export const COLLECTIONS = {
  USERS: 'users',
  RESTAURANTS: 'restaurants',
  ORDERS: 'orders',
  COUPONS: 'coupons',
  OFFERS: 'offers',
} as const;

/** Subcolecciones bajo restaurants/{restId} */
export const RESTAURANT_SUB = {
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
} as const;

/** Subcolección users/{uid}/notifications */
export const USER_SUB = {
  NOTIFICATIONS: 'notifications',
} as const;

export const STORAGE_KEYS = {
  AUTH_USER: 'quickbite_auth_user',
  REMEMBER_DEVICE: 'quickbite_remember_device',
} as const;

/** Estados de pedido (orders.status) */
export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  REJECTED: 'rejected',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  preparing: 'En cocina',
  ready: 'Listo',
  on_the_way: 'En camino',
  delivered: 'Entregado',
  rejected: 'Rechazado',
};

/**
 * Tipos de cocina para cuisineTypes (chips de Configuración).
 * ⚠️ Estos valores se guardan tal cual en restaurants/{id}.cuisineTypes y la app
 * cliente los usa para el filtro de categorías del Home. Si el filtro de la app
 * usa otros valores exactos, ajusta esta lista para que empaten.
 */
export const CUISINE_OPTIONS = [
  'Mexicana',
  'Hamburguesas',
  'Pizza',
  'Tacos',
  'Sushi',
  'China',
  'Italiana',
  'Mariscos',
  'Pollo',
  'Antojitos',
  'Desayunos',
  'Cafetería',
  'Postres',
  'Saludable',
  'Vegetariana',
  'Comida rápida',
  'Parrilla',
  'Bebidas',
] as const;

/** Días de la semana: clave de Firestore (schedule) + etiqueta en español. */
export const WEEK_DAYS: { key: WeekDayKey; label: string }[] = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#eef8f1" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="#086931" font-size="18">Sin imagen</text></svg>'
  );
