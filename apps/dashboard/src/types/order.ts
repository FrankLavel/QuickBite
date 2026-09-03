/**
 * types/order.ts
 * Colección orders/{orderId}
 */

// Enums del contrato de pedido: fuente de verdad en @quickbite/shared (F5).
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentProvider,
} from '@quickbite/shared';

export type { OrderStatus, PaymentMethod, PaymentStatus, PaymentProvider };

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
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Pasarela usada (solo pagos con tarjeta). Ausente en cash/paypal. */
  paymentProvider?: PaymentProvider;
  /** Id del cargo en Openpay (para conciliar/reembolsar). */
  openpayChargeId?: string;
  /** Marca y últimos 4 de la tarjeta, para mostrar en el pedido. */
  cardBrand?: string | null;
  cardLast4?: string | null;
  paidAt?: unknown;
  refundedAt?: unknown;
  /** Momento en que la plataforma liquidó (pagó) este pedido al restaurante. */
  settledAt?: unknown;
  couponCode: string | null;
  specialInstructions?: string;
  /** Motivo del rechazo (lo escribe el restaurante al rechazar el pedido). */
  rejectionReason?: string;
  estimatedTime?: number;
  rating?: number;
  createdAt?: unknown;
  acceptedAt?: unknown;
  deliveredAt?: unknown;
  cancelledAt?: unknown;
  /** Denormalizados en el pedido por la app cliente (para mostrar/contactar). */
  customerName?: string;
  customerPhone?: string;
  /** Reparto (los escribe la app QuickBite Driver al reclamar/avanzar). */
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  assignedAt?: unknown;
  pickedUpAt?: unknown;
  /** Propina para el repartidor (la elige el cliente en el checkout). */
  tip?: number;
  /** Momento en que la plataforma liquidó este pedido al repartidor. */
  driverSettledAt?: unknown;
}
