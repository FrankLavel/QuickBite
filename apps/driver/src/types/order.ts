/**
 * types/order.ts
 * orders/{orderId} — subconjunto relevante para el repartidor, más los campos de
 * reparto (driverId, assignedAt, pickedUpAt) que introduce la app Driver.
 * El contrato completo del pedido vive en las otras apps del ecosistema.
 */
// Enums del contrato de pedido: fuente de verdad en @quickbite/shared (F5).
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@quickbite/shared';

export type { OrderStatus, PaymentMethod, PaymentStatus };

export interface OrderItemTopping {
  name: string;
  price?: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  toppings?: OrderItemTopping[];
  subtotal: number;
  notes?: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  references?: string;
  coords?: { lat: number; lng: number };
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  deliveryAddress: DeliveryAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  // Denormalizados por la app cliente (para mostrar/contactar).
  customerName?: string;
  customerPhone?: string;

  // ---- Campos de reparto (app Driver) ----
  /** uid del repartidor que reclamó el pedido. Ausente/'' = disponible. */
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  assignedAt?: unknown;
  pickedUpAt?: unknown;
  /** Propina para el repartidor (la elige el cliente en el checkout). */
  tip?: number;
  /** Momento en que la plataforma liquidó (pagó) este pedido al repartidor. */
  driverSettledAt?: unknown;

  estimatedTime?: number;
  createdAt?: unknown;
  readyAt?: unknown;
  deliveredAt?: unknown;
}
