/**
 * context/OrderContext.tsx
 * Pedidos del restaurante (orders donde restaurantId coincide).
 */

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getRestaurantOrders,
  listenRestaurantOrders,
  updateOrderStatus,
} from '../services/orderService';
import { useAuth } from '../hooks/useAuth';
import type { Order, OrderStatus } from '../types/order';

interface OrderContextValue {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setStatus: (orderId: string, status: OrderStatus, estimatedTime?: number) => Promise<void>;
}

export const OrderContext = createContext<OrderContextValue | undefined>(
  undefined
);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) {
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await getRestaurantOrders(restaurantId);
      setOrders(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudieron cargar los pedidos'
      );
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  // Suscripción en tiempo real: los pedidos se actualizan solos (nuevos,
  // cambios de status del cliente, etc.) sin necesidad de refrescar a mano.
  useEffect(() => {
    if (!restaurantId) {
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = listenRestaurantOrders(
      restaurantId,
      (list) => {
        setOrders(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(
          err instanceof Error ? err.message : 'No se pudieron cargar los pedidos'
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [restaurantId]);

  const setStatus = useCallback(
    async (orderId: string, status: OrderStatus, estimatedTime?: number) => {
      await updateOrderStatus(orderId, status, estimatedTime);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status, estimatedTime } : o))
      );
    },
    []
  );

  const value = useMemo(
    () => ({ orders, loading, error, refresh, setStatus }),
    [orders, loading, error, refresh, setStatus]
  );

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}
