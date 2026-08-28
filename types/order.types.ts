import { Timestamp } from 'firebase/firestore';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'on_the_way'
  | 'delivered'
  | 'rejected' // el restaurante rechaza el pedido
  | 'cancelled'; // el cliente cancela el pedido (solo mientras está 'pending')

export type PaymentMethod = 'card' | 'paypal' | 'cash';

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export type PaymentProvider = 'openpay';

/** Topping ya elegido dentro de un ítem del pedido. */
export interface OrderItemTopping {
  name: string;
  price: number;
}

/**
 * Promoción aplicada a una línea del carrito (viene de una oferta de platillo).
 * 'percent': N% de descuento (100 = gratis). '2x1': paga 1 de cada 2.
 */
export type LinePromo =
  | { kind: 'percent'; percent: number }
  | { kind: '2x1' };

/** Ítem dentro del documento del pedido. */
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

/** Dirección de entrega capturada en Checkout. */
export interface OrderDeliveryAddress {
  street: string;
  city: string;
  references?: string;
  coords: { lat: number; lng: number };
}

/** Documento /orders/{orderId}. */
export interface Order {
  id: string;
  /** Siempre = auth.uid del usuario actual. */
  customerId: string;
  /** Nombre del cliente, denormalizado para que el dashboard lo muestre
   *  (el restaurante no puede leer users/{customerId} por las reglas). */
  customerName?: string;
  /** Teléfono del cliente, denormalizado para que el restaurante lo contacte. */
  customerPhone?: string;
  restaurantId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  /** Propina para el repartidor (opcional, la elige el cliente en el checkout). */
  tip?: number;
  deliveryAddress: OrderDeliveryAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Pasarela usada (solo pagos con tarjeta). Ausente en cash/paypal. */
  paymentProvider?: PaymentProvider;
  /** Id del cargo en Openpay (para conciliar/reembolsar). */
  openpayChargeId?: string;
  /** Marca y últimos 4 de la tarjeta, para mostrar en el recibo/dashboard. */
  cardBrand?: string | null;
  cardLast4?: string | null;
  /** Momento del cobro exitoso. */
  paidAt?: Timestamp;
  /** Momento del reembolso (si aplica). */
  refundedAt?: Timestamp;
  /** Momento en que la plataforma liquidó este pedido al restaurante. */
  settledAt?: Timestamp;
  /** Código del cupón aplicado. null si no se usó. */
  couponCode: string | null;
  specialInstructions?: string;
  /** Motivo del rechazo escrito por el restaurante (status = 'rejected'). */
  rejectionReason?: string;
  /** Minutos estimados de entrega, asignado por el restaurante al aceptar. */
  estimatedTime?: number;
  /** Calificación 1–5 enviada por el cliente en Order Confirmation. */
  rating?: number;
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
  deliveredAt?: Timestamp;
  /** Momento en que el cliente canceló el pedido (status = 'cancelled'). */
  cancelledAt?: Timestamp;
}

/**
 * Datos que el cliente arma en Checkout para crear el pedido. El servicio
 * completa status, paymentStatus y createdAt al escribir el documento.
 */
export type NewOrderInput = Pick<
  Order,
  | 'customerId'
  | 'restaurantId'
  | 'items'
  | 'subtotal'
  | 'deliveryFee'
  | 'discount'
  | 'total'
  | 'deliveryAddress'
  | 'paymentMethod'
  | 'couponCode'
> &
  Partial<Pick<Order, 'specialInstructions' | 'customerName' | 'customerPhone'>>;

/**
 * Estado local del carrito (antes del checkout). No es una colección de
 * Firestore; al crear el pedido se convierte en OrderItem[].
 */
export interface CartItemType {
  /** ID único de la LÍNEA del carrito: producto + toppings + notas. Distingue
   *  el mismo platillo con distintas personalizaciones. */
  id: string;
  /** ID del producto en Firestore (varias líneas pueden compartirlo). */
  productId: string;
  name: string;
  /** Precio unitario, ya incluye los toppings seleccionados. */
  price: number;
  quantity: number;
  toppings?: OrderItemTopping[];
  imageURL?: string;
  /** Instrucciones especiales del cliente para este platillo (opcional). */
  notes?: string;
  /** Promoción activa de una oferta de platillo (opcional). */
  promo?: LinePromo;
}

/**
 * deliveryTracking/{orderId} — ubicación en vivo del repartidor durante una
 * entrega en camino. La escribe la app QuickBite Driver; se borra al entregar.
 */
export interface DeliveryTracking {
  orderId: string;
  driverId: string;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  updatedAt?: unknown;
}
