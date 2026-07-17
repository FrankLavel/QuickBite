/**
 * types/order.ts
 * Colección orders/{orderId}
 */

import type { ORDER_STATUS } from '../utils/constants';

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export interface OrderItemTopping {
  name: string;
  price?: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  toppings: OrderItemTopping[];
  subtotal: number;
  /** Instrucciones especiales del cliente para este platillo (opcional). */
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
  paymentMethod: 'card' | 'paypal' | 'cash';
  paymentStatus: 'paid' | 'pending' | 'failed';
  couponCode: string | null;
  specialInstructions?: string;
  estimatedTime?: number;
  rating?: number;
  createdAt?: unknown;
  acceptedAt?: unknown;
  deliveredAt?: unknown;
  cancelledAt?: unknown;
  /** Denormalizados en el pedido por la app cliente (para mostrar/contactar). */
  customerName?: string;
  customerPhone?: string;
}
