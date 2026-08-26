/**
 * navigation/navigationRef.ts
 * Ref global de navegación para navegar desde fuera de React (p. ej. al tocar
 * una notificación push).
 */
import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
