/**
 * navigation/MainNavigator.tsx
 * Pantallas del portal con sidebar (ScreenShell en cada pantalla).
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import { HomeScreen } from '../screens/dashboard/HomeScreen';
import { OrdersScreen } from '../screens/dashboard/OrdersScreen';
import { DeliveriesScreen } from '../screens/dashboard/DeliveriesScreen';
import { MenuScreen } from '../screens/dashboard/MenuScreen';
import { PromotionsScreen } from '../screens/dashboard/PromotionsScreen';
import { AnalyticsScreen } from '../screens/dashboard/AnalyticsScreen';
import { LiquidacionesScreen } from '../screens/dashboard/LiquidacionesScreen';
import { CustomersScreen } from '../screens/dashboard/CustomersScreen';
import { NotificationsScreen } from '../screens/dashboard/NotificationsScreen';
import { SettingsScreen } from '../screens/dashboard/SettingsScreen';
import { PreferencesScreen } from '../screens/dashboard/PreferencesScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Panel"
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="Panel" component={HomeScreen} />
      <Stack.Screen name="Pedidos" component={OrdersScreen} />
      <Stack.Screen name="Entregas" component={DeliveriesScreen} />
      <Stack.Screen name="Menu" component={MenuScreen} />
      <Stack.Screen name="Promociones" component={PromotionsScreen} />
      <Stack.Screen name="Analiticas" component={AnalyticsScreen} />
      <Stack.Screen name="Liquidaciones" component={LiquidacionesScreen} />
      <Stack.Screen name="Clientes" component={CustomersScreen} />
      <Stack.Screen name="Notificaciones" component={NotificationsScreen} />
      <Stack.Screen name="Configuracion" component={SettingsScreen} />
      <Stack.Screen name="Preferencias" component={PreferencesScreen} />
    </Stack.Navigator>
  );
}
