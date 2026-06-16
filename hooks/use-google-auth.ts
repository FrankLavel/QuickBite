import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/contexts/auth-context';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth(onLoadingChange?: (loading: boolean) => void) {
  const { signInWithGoogle, isGoogleConfigured } = useAuth();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') {
        onLoadingChange?.(false);
        Alert.alert('Error', 'No se pudo completar el inicio de sesión con Google.');
      }
      return;
    }

    const idToken = response.params.id_token ?? response.authentication?.idToken;

    if (!idToken) {
      onLoadingChange?.(false);
      Alert.alert('Error', 'Google no devolvió un token válido. Intenta de nuevo.');
      return;
    }

    signInWithGoogle(idToken)
      .catch((error) => {
        Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
      })
      .finally(() => {
        onLoadingChange?.(false);
      });
  }, [response, signInWithGoogle, onLoadingChange]);

  const signIn = async () => {
    if (!isGoogleConfigured) {
      Alert.alert(
        'Configuración requerida',
        'Agrega EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en tu archivo .env y habilita Google en Firebase Auth.',
      );
      return;
    }

    if (!request) {
      Alert.alert('Error', 'Google Sign-In aún no está listo. Intenta de nuevo en un momento.');
      return;
    }

    onLoadingChange?.(true);
    await promptAsync();
  };

  return {
    signIn,
    isReady: Boolean(request),
    isConfigured: isGoogleConfigured,
  };
}
