/**
 * hooks/useOrders.ts
 */
import { useContext } from 'react';
import { OrderContext } from '../context/OrderContext';

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders debe usarse dentro de OrderProvider');
  }
  return context;
}
