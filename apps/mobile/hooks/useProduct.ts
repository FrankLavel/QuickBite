import { useState, useEffect } from 'react';
import { Product } from '@/types/product.types';
import { Restaurant } from '@/types/restaurant.types';
import { restaurantsService } from '@/services/restaurants.service';

/** Detalle de un producto junto con su restaurante (para precio, tiempo, etc.). */
export function useProduct(restaurantId?: string, productId?: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId || !productId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);

    Promise.all([
      restaurantsService.getProductById(restaurantId, productId),
      restaurantsService.getById(restaurantId),
    ])
      .then(([p, r]) => {
        if (!active) return;
        setProduct(p);
        setRestaurant(r);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [restaurantId, productId]);

  return { product, restaurant, loading };
}
