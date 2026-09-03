import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import {
  useAuth,
  useEmailGate,
  resendVerification,
  refreshEmailVerified,
  signOutUser,
} from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { showAlert } from '@/store/dialogStore';

/**
 * Bloqueo estricto por correo sin verificar: mientras la cuenta de
 * correo/contraseña no confirme su email, no puede entrar a la app. Ofrece
 * reenviar el enlace, revalidar ("ya verifiqué") o cambiar de cuenta.
 * Las cuentas de Google no llegan aquí (ya vienen verificadas).
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { loading } = useAuth();
  const { authEmail, emailVerified, needsVerification } = useEmailGate();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={palette.primary} />
      </SafeAreaView>
    );
  }
  // Sin sesión → al inicio. Ya verificado (o Google) → a la app.
  if (!authEmail) return <Redirect href="/(auth)/onboarding" />;
  if (emailVerified || !needsVerification) return <Redirect href="/(tabs)" />;

  const resend = async () => {
    if (resending) return;
    setResending(true);
    try {
      await resendVerification();
      void showAlert({ title: t('verifyEmail.resentTitle'), message: t('verifyEmail.resentMsg') });
    } catch {
      void showAlert({ title: t('common.error'), message: t('verifyEmail.error') });
    } finally {
      setResending(false);
    }
  };

  const check = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const ok = await refreshEmailVerified();
      if (ok) {
        router.replace('/(tabs)');
      } else {
        void showAlert({ title: t('verifyEmail.notYetTitle'), message: t('verifyEmail.notYetMsg') });
      }
    } finally {
      setChecking(false);
    }
  };

  const useOtherAccount = async () => {
    await signOutUser();
    router.replace('/(auth)/onboarding');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1 justify-center px-6 gap-7">
        <View className="items-center gap-3">
          <View className="bg-primary-container w-16 h-16 rounded-full items-center justify-center">
            <Icon name="mark-email-unread" color={palette.onPrimaryContainer} size={30} />
          </View>
          <Text className="text-2xl font-bold text-on-background text-center">
            {t('verifyEmail.title')}
          </Text>
          <Text className="text-on-surface-variant text-center leading-5">
            {t('verifyEmail.sub', { email: authEmail })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={check}
          disabled={checking}
          activeOpacity={0.9}
          className="h-14 bg-primary rounded-full items-center justify-center"
          style={checking ? { opacity: 0.6 } : undefined}
        >
          {checking ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-base">{t('verifyEmail.check')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={resend}
          disabled={resending}
          activeOpacity={0.8}
          className="h-14 bg-surface-container rounded-full items-center justify-center"
          style={resending ? { opacity: 0.6 } : undefined}
        >
          {resending ? (
            <ActivityIndicator color={palette.primary} />
          ) : (
            <Text className="text-primary font-bold text-base">{t('verifyEmail.resend')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={useOtherAccount} activeOpacity={0.7} className="items-center">
          <Text className="text-on-surface-variant font-semibold">
            {t('verifyEmail.changeAccount')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
