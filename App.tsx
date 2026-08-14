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

/** Aplica el tema (variables CSS) según la preferencia guardada. */
function ThemeController() {
  const { theme } = usePreferences();
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return null;
}

export default function App() {
  useEffect(() => {
    loadPreferences();
  }, []);

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
