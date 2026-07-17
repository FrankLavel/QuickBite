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

export type PaymentStatus = 'paid' | 'pending' | 'failed';

/** Topping ya elegido dentro de un ítem del pedido. */
export interface OrderItemTopping {
  name: string;
  price: number;
}

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
  deliveryAddress: OrderDeliveryAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Código del cupón aplicado. null si no se usó. */
  couponCode: string | null;
  specialInstructions?: string;
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
}
