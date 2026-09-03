/**
 * App.tsx
 * Punto de entrada QuickBite Merchant Portal.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ToastHost } from './src/components/ToastHost';
import { ConfirmHost } from './src/components/ConfirmHost';
import { loadPreferences, usePreferences } from './src/utils/preferences';
import { applyTheme } from './src/utils/theme';
import { setupWebApp } from './src/utils/pwa';
import { useFonts } from 'expo-font';
import { Feather } from '@expo/vector-icons';

/** Aplica el tema (variables CSS) según la preferencia guardada. */
function ThemeController() {
  const { theme } = usePreferences();
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return null;
}

export default function App() {
  // Carga explícita de la fuente de iconos (Feather). En dev Expo la inyecta
  // sola, pero en el build web exportado hay que registrarla o los iconos se
  // ven como cuadros vacíos.
  const [fontsLoaded, fontError] = useFonts(Feather.font);

  useEffect(() => {
    loadPreferences();
    setupWebApp();
  }, []);

  // Espera a la fuente; si fallara la carga, igual renderiza (mejor iconos
  // como cuadro que pantalla en blanco).
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeController />
        <StatusBar style="auto" />
        <AppNavigator />
        <ToastHost />
        <ConfirmHost />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
