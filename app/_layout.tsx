import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useAuthListener } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ForegroundNotificationBanner } from '@/components/notifications/ForegroundNotificationBanner';
import { DialogHost } from '@/components/ui/DialogHost';
import { useThemeScheme, useFullScheme } from '@/hooks/useColors';
import { useA11yStore } from '@/store/a11yStore';
import { themeVars } from '@/lib/theme';
import { setPaletteScheme } from '@/constants/colors';
import { setTextScale } from '@/lib/textScale';

export default function RootLayout() {
  // Sincroniza la sesión persistida con el store apenas arranca la app.
  useAuthListener();
  // Push: canal, registro de token y navegación al tocar la notificación.
  usePushNotifications();

  const scheme = useThemeScheme(); // base: light | dark
  const fullScheme = useFullScheme(); // + alto contraste
  const largeText = useA11yStore((s) => s.largeText);
  // Sincroniza paleta inline (íconos) y escala de texto antes de renderizar hijos.
  setPaletteScheme(fullScheme);
  setTextScale(largeText ? 1.15 : 1);
  const { setColorScheme } = useNativeWindColorScheme();

  // Mantiene el colorScheme de NativeWind alineado con la preferencia del usuario.
  useEffect(() => {
    setColorScheme(scheme);
  }, [scheme, setColorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <View style={themeVars[fullScheme]} className="flex-1 bg-background">
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="restaurant/[id]" />
          <Stack.Screen name="product/[id]" />
          <Stack.Screen name="cart" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="confirmation" />
          <Stack.Screen name="tracking" />
          <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
          <Stack.Screen name="settings" />
          <Stack.Screen name="accessibility" />
          <Stack.Screen name="security" />
          <Stack.Screen name="legal" />
        </Stack>
        <ForegroundNotificationBanner />
        <DialogHost />
      </View>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
