/**
 * navigation/AppNavigator.tsx
 * Raíz: Auth o Portal autenticado (Product + Order providers).
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { ProductFormScreen } from '../screens/menu/ProductFormScreen';
import { CouponFormScreen } from '../screens/promotions/CouponFormScreen';
import { OfferFormScreen } from '../screens/promotions/OfferFormScreen';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ProductProvider } from '../context/ProductContext';
import { OrderProvider } from '../context/OrderContext';
import { PromotionProvider } from '../context/PromotionContext';
import { navigationRef } from './navigationRef';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Etiqueta bonita por ruta para el título de la pestaña (QuickBite · <pantalla>).
const TAB_TITLES: Record<string, string> = {
  Login: 'Iniciar sesión',
  Panel: 'Panel',
  Pedidos: 'Pedidos',
  Entregas: 'Entregas',
  Menu: 'Menú',
  Promociones: 'Promociones',
  Analiticas: 'Analíticas',
  Liquidaciones: 'Liquidaciones',
  Clientes: 'Clientes',
  Notificaciones: 'Notificaciones',
  Configuracion: 'Configuración',
  Preferencias: 'Preferencias',
  ProductForm: 'Menú',
  CouponForm: 'Promociones',
  OfferForm: 'Promociones',
};

function AuthenticatedApp() {
  return (
    <ProductProvider>
      <OrderProvider>
        <PromotionProvider>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen
              name="ProductForm"
              component={ProductFormScreen}
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="CouponForm"
              component={CouponFormScreen}
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="OfferForm"
              component={OfferFormScreen}
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
          </Stack.Navigator>
        </PromotionProvider>
      </OrderProvider>
    </ProductProvider>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay message="Preparando QuickBite..." />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      documentTitle={{
        formatter: (options, route) =>
          `QuickBite · ${
            options?.title ?? TAB_TITLES[route?.name ?? ''] ?? route?.name ?? 'Portal'
          }`,
      }}
    >
      {user ? <AuthenticatedApp /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
