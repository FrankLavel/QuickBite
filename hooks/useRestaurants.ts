import { useState, useEffect } from 'react';
import { Restaurant } from '@/types/restaurant.types';
import { restaurantsService } from '@/services/restaurants.service';

/**
 * Lista de restaurantes para el Home. Sin filtro trae los abiertos en orden
 * neutral (alfabético); con `cuisine` filtra por tipo de cocina. El orden por
 * rating/envío es opt-in desde los filtros del Home.
 */
export function useRestaurants(cuisine?: string) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const onData = (data: Restaurant[]) => {
      setRestaurants(data);
      setLoading(false);
    };
    const onError = () => {
      setError(true);
      setLoading(false);
    };

    const unsubscribe = cuisine
      ? restaurantsService.listenByCuisine(cuisine, onData, onError)
      : restaurantsService.listenOpenRestaurants(onData, onError);

    return unsubscribe;
  }, [cuisine]);

  return { restaurants, loading, error };
}
