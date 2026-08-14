/**
 * types/navigation.ts
 * Parámetros tipados de React Navigation.
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/** Pantallas del portal (sidebar) */
export type MainStackParamList = {
  Panel: undefined;
  Pedidos: undefined;
  Entregas: undefined;
  Menu: undefined;
  Promociones: undefined;
  Analiticas: undefined;
  Liquidaciones: undefined;
  Clientes: undefined;
  Notificaciones: undefined;
  Configuracion: undefined;
  Preferencias: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  ProductForm: { productId?: string };
  CouponForm: { code?: string };
  OfferForm: { offerId?: string };
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainScreenProps<T extends keyof MainStackParamList> =
  NativeStackScreenProps<MainStackParamList, T>;

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
