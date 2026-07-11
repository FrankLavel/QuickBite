import { useState, useEffect } from 'react';
import { Restaurant } from '@/types/restaurant.types';
import { Category, Product } from '@/types/product.types';
import { restaurantsService } from '@/services/restaurants.service';

/**
 * Detalle de un restaurante con su catálogo: trae el documento, las categorías
 * visibles y los productos disponibles en paralelo.
 */
export function useRestaurant(id?: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // Tres suscripciones en vivo: al editar el restaurante o su menú desde el
    // dashboard, el detalle se actualiza al instante sin recargar.
    const unsubRestaurant = restaurantsService.listenById(id, (r) => {
      setRestaurant(r);
      setLoading(false);
    });
    const unsubCategories = restaurantsService.listenCategories(
      id,
      setCategories
    );
    const unsubProducts = restaurantsService.listenProducts(id, setProducts);

    return () => {
      unsubRestaurant();
      unsubCategories();
      unsubProducts();
    };
  }, [id]);

  return { restaurant, categories, products, loading };
}
