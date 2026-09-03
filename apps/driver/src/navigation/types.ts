/**
 * navigation/types.ts
 * Tipos de rutas para React Navigation.
 */
import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Available: undefined;
  MyDeliveries: undefined;
  Earnings: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  OrderDetail: { orderId: string };
};
