import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types/order.types';
import { Restaurant } from '@/types/restaurant.types';
import { ordersService } from '@/services/orders.service';
import { restaurantsService } from '@/services/restaurants.service';
import { useAuthStore } from '@/store/authStore';

const ACTIVE_STATUSES: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'on_the_way',
];

/**
 * Historial de pedidos del cliente EN TIEMPO REAL, con los restaurantes
 * asociados resueltos (el modelo de orders no denormaliza el nombre).
 */
export function useOrders() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Record<string, Restaurant>>({});
  const [loading, setLoading] = useState(true);

  // Suscripción en vivo a los pedidos.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const unsub = ordersService.listenMyOrders(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  // Carga los restaurantes cuando cambia el conjunto de IDs.
  const restaurantIdsKey = [...new Set(orders.map((o) => o.restaurantId))].sort().join(',');
  useEffect(() => {
    const ids = restaurantIdsKey ? restaurantIdsKey.split(',') : [];
    if (ids.length === 0) return;
    let active = true;
    restaurantsService.getByIds(ids).then((rests) => {
      if (!active) return;
      const map: Record<string, Restaurant> = {};
      rests.forEach((r) => {
        map[r.id] = r;
      });
      setRestaurants(map);
    });
    return () => {
      active = false;
    };
  }, [restaurantIdsKey]);

  return {
    orders,
    activeOrders: orders.filter((o) => ACTIVE_STATUSES.includes(o.status)),
    completed: orders.filter((o) => o.status === 'delivered'),
    cancelled: orders.filter((o) => o.status === 'rejected' || o.status === 'cancelled'),
    restaurants,
    loading,
  };
}
