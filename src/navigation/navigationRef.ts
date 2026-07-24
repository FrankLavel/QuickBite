/**
 * navigation/navigationRef.ts
 * Referencia global de navegación para poder navegar desde fuera de componentes
 * (ej. desde el listener de pedidos al tocar un toast de "nuevo pedido").
 */

import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Navega a la pantalla de Pedidos (dentro del stack autenticado). */
export function navigateToOrders() {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Main', { screen: 'Pedidos' });
  }
}
