import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth, useEmailGate } from '@/hooks/useAuth';
import { palette } from '@/constants/colors';

/**
 * Ruta de entrada (`/`): decide el destino según la sesión persistida —tabs si
 * hay usuario, onboarding si no. Sin pantalla de splash/carga artificial:
 * mientras Firebase resuelve la sesión se muestra un indicador neutro y en
 * cuanto está lista se redirige. El splash instantáneo lo cubre el nativo (Expo).
 */
export default function Index() {
  const { user, loading } = useAuth();
  const { needsVerification } = useEmailGate();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  // Bloqueo estricto: sesión de correo sin verificar → a verificar el correo.
  if (needsVerification) return <Redirect href="/(auth)/verificar-correo" />;

  return <Redirect href={user ? '/(tabs)' : '/(auth)/onboarding'} />;
}
