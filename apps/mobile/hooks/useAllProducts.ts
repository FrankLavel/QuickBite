import { useEffect, useRef, useState } from 'react';
import { restaurantsService } from '@/services/restaurants.service';

export interface SearchableProduct {
  restaurantId: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  imageURL: string;
}

/**
 * Carga los platillos (disponibles) de todos los restaurantes para poder buscar
 * por nombre de platillo en el Home. Es perezoso: solo carga cuando `enabled`
 * se vuelve true (el usuario empezó a buscar) y cachea el resultado para no
 * volver a pedirlo en cada tecla.
 */
export function useAllProducts(restaurantIds: string[], enabled: boolean) {
  const [products, setProducts] = useState<SearchableProduct[]>([]);
  const loadedRef = useRef(false);
  const idsKey = [...restaurantIds].sort().join(',');

  useEffect(() => {
    if (!enabled || loadedRef.current || restaurantIds.length === 0) return;
    loadedRef.current = true;
    let active = true;
    Promise.all(
      restaurantIds.map(async (rid) => {
        const prods = await restaurantsService.getProducts(rid);
        return prods.map((p) => ({
          restaurantId: rid,
          productId: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          imageURL: p.imageURL,
        }));
      })
    )
      .then((arrays) => {
        if (active) setProducts(arrays.flat());
      })
      .catch(() => {
        // si falla la carga, la búsqueda simplemente no incluye platillos
        loadedRef.current = false;
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, idsKey]);

  return products;
}
