import { httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { NewProductReview, ProductReview } from '@/types/review.types';

const reviewsCol = (restId: string, prodId: string) =>
  collection(db, 'restaurants', restId, 'products', prodId, 'reviews');

/**
 * Envía la reseña vía Cloud Function: el servidor verifica que el usuario recibió
 * el producto en un pedido entregado y la escribe con el Admin SDK. El cliente ya
 * no escribe reseñas directamente (las reglas lo bloquean) (F7).
 */
const submitReviewFn = httpsCallable<
  { restaurantId: string; productId: string; rating: number; comment: string },
  { ok: boolean }
>(functions, 'submitReview');

export const reviewsService = {
  /** Reseñas del producto, más recientes primero. */
  list: async (restId: string, prodId: string): Promise<ProductReview[]> => {
    const snap = await getDocs(reviewsCol(restId, prodId));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as ProductReview))
      .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  },

  /**
   * Crea o reemplaza la reseña del usuario. El servidor deriva el pedido que la
   * respalda y el nombre/foto del perfil; aquí solo van rating y comentario.
   */
  submit: async (
    restId: string,
    prodId: string,
    review: NewProductReview
  ): Promise<void> => {
    await submitReviewFn({
      restaurantId: restId,
      productId: prodId,
      rating: review.rating,
      comment: review.comment,
    });
  },
};
