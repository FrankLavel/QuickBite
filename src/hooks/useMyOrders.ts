/**
 * hooks/useMyOrders.ts
 * Suscripción en tiempo real a los pedidos del repartidor autenticado.
 */
import { useEffect, useState } from 'react';
import { listenMyOrders } from '../services/deliveryService';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../types/order';

export function useMyOrders(): Order[] | null {
  const { driver } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!driver) return;
    return listenMyOrders(driver.uid, setOrders);
  }, [driver]);

  return orders;
}
