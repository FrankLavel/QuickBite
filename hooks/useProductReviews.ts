import { useCallback, useEffect, useState } from 'react';
import { reviewsService } from '@/services/reviews.service';
import { ordersService } from '@/services/orders.service';
import { useAuthStore } from '@/store/authStore';
import { ProductReview } from '@/types/review.types';

/**
 * Reseñas de un producto + estado del usuario actual:
 * - `reviews`: lista de reseñas.
 * - `myReview`: la reseña propia (si existe).
 * - `eligibleOrderId`: id del pedido entregado que habilita reseñar (o null).
 * Solo puede reseñar quien tiene una compra verificada (eligibleOrderId != null).
 */
export function useProductReviews(restaurantId?: string, productId?: string) {
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [myReview, setMyReview] = useState<ProductReview | null>(null);
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!restaurantId || !productId) return;
    setLoading(true);
    try {
      const list = await reviewsService.list(restaurantId, productId);
      setReviews(list);
      if (user) {
        setMyReview(list.find((r) => r.userId === user.uid) ?? null);
        const orderId = await ordersService.deliveredOrderIdForProduct(
          user.uid,
          restaurantId,
          productId
        );
        setEligibleOrderId(orderId);
      } else {
        setMyReview(null);
        setEligibleOrderId(null);
      }
    } finally {
      setLoading(false);
    }
  }, [restaurantId, productId, user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    reviews,
    myReview,
    eligibleOrderId,
    canReview: !!eligibleOrderId,
    loading,
    reload: load,
  };
}
