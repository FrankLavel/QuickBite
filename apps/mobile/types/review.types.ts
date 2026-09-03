import { Timestamp } from 'firebase/firestore';

/**
 * Subcolección /restaurants/{restId}/products/{prodId}/reviews/{userId}.
 * El ID del documento es el uid del autor → una sola reseña por usuario y
 * producto (crear de nuevo la reemplaza/edita). Solo la puede escribir quien
 * tiene un pedido 'delivered' propio que respalde la compra (ver orderId).
 */
export interface ProductReview {
  /** = userId (id del documento). */
  id: string;
  userId: string;
  /** Nombre del autor, denormalizado para mostrar sin leer /users. */
  userName: string;
  /** Avatar del autor, denormalizado (opcional). */
  userPhotoURL?: string;
  /** Pedido entregado que respalda la reseña (compra verificada). */
  orderId: string;
  /** Calificación 1–5. */
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

/** Datos que el cliente envía al crear/editar su reseña. */
export type NewProductReview = Pick<
  ProductReview,
  'userId' | 'userName' | 'orderId' | 'rating' | 'comment'
> &
  Partial<Pick<ProductReview, 'userPhotoURL'>>;
