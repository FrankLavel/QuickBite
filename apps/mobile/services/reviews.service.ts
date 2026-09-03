import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { NewProductReview, ProductReview } from '@/types/review.types';

const reviewsCol = (restId: string, prodId: string) =>
  collection(db, 'restaurants', restId, 'products', prodId, 'reviews');

const reviewRef = (restId: string, prodId: string, userId: string) =>
  doc(db, 'restaurants', restId, 'products', prodId, 'reviews', userId);

export const reviewsService = {
  /** Reseñas del producto, más recientes primero. */
  list: async (restId: string, prodId: string): Promise<ProductReview[]> => {
    const snap = await getDocs(reviewsCol(restId, prodId));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as ProductReview))
      .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  },

  /**
   * Crea o reemplaza la reseña del usuario (doc id = userId). Las Security
   * Rules exigen que orderId sea un pedido 'delivered' del propio usuario.
   */
  submit: (
    restId: string,
    prodId: string,
    review: NewProductReview
  ): Promise<void> =>
    setDoc(reviewRef(restId, prodId, review.userId), {
      ...review,
      createdAt: serverTimestamp(),
    }),
};
