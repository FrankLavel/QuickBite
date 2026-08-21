/**
 * context/OrderContext.tsx
 * Pedidos del restaurante (orders donde restaurantId coincide).
 */

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getRestaurantOrders,
  listenRestaurantOrders,
  updateOrderStatus,
} from '../services/orderService';
import { useAuth } from '../hooks/useAuth';
import type { Order, OrderStatus } from '../types/order';
import { ORDER_STATUS } from '../utils/constants';
import { notify } from '../utils/notify';
import { formatCurrency } from '../utils/format';
import { playNewOrderChime } from '../utils/sound';
import { navigateToOrders } from '../navigation/navigationRef';
import { getPreferences } from '../utils/preferences';

interface OrderContextValue {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setStatus: (
    orderId: string,
    status: OrderStatus,
    estimatedTime?: number,
    rejectionReason?: string
  ) => Promise<void>;
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

  // IDs de pedidos ya conocidos + bandera de carga inicial, para avisar solo
  // de pedidos NUEVOS (no de los que ya existían al abrir la app).
  const knownIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  /** Dispara un toast por cada pedido nuevo pendiente respecto a lo conocido. */
  const announceNewOrders = useCallback((list: Order[]) => {
    if (initialized.current) {
      const fresh = list.filter(
        (o) =>
          o.status === ORDER_STATUS.PENDING && !knownIds.current.has(o.id)
      );
      const prefs = getPreferences();
      if (fresh.length > 0 && prefs.orderSound) {
        playNewOrderChime();
      }
      if (prefs.orderToast) {
        fresh.forEach((o) => {
          const units = o.items.reduce((s, i) => s + i.qty, 0);
          const who = o.customerName ? `${o.customerName} · ` : '';
          notify(
            `${who}${units} artículo(s) · ${formatCurrency(o.total)}`,
            'info',
            {
              title: `Nuevo pedido #${o.id.slice(0, 6).toUpperCase()}`,
              durationMs: 8000,
              onPress: navigateToOrders,
            }
          );
        });
      }
    }
    knownIds.current = new Set(list.map((o) => o.id));
    initialized.current = true;
  }, []);

  const refresh = useCallback(async () => {
    if (!restaurantId) {
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await getRestaurantOrders(restaurantId);
      announceNewOrders(list);
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
    // Reinicia el control de "nuevos" al cambiar de restaurante / sesión, para
    // que la primera carga no dispare avisos de pedidos ya existentes.
    knownIds.current = new Set();
    initialized.current = false;

    if (!restaurantId) {
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = listenRestaurantOrders(
      restaurantId,
      (list) => {
        announceNewOrders(list);
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
  }, [restaurantId, announceNewOrders]);

  const setStatus = useCallback(
    async (
      orderId: string,
      status: OrderStatus,
      estimatedTime?: number,
      rejectionReason?: string
    ) => {
      await updateOrderStatus(orderId, status, estimatedTime, rejectionReason);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status, estimatedTime, ...(rejectionReason ? { rejectionReason } : {}) }
            : o
        )
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
