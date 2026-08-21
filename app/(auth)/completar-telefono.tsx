import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users.service';
import { useTranslation } from '@/hooks/useTranslation';
import { showAlert } from '@/store/dialogStore';

/**
 * Paso para completar el teléfono cuando la cuenta no lo tiene (típico al entrar
 * con Google, que no pasa por el registro). Se muestra una sola vez: en cuanto
 * hay teléfono, redirige a la app. Así el restaurante siempre tiene cómo marcar.
 */
export default function CompletePhoneScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={palette.primary} />
      </SafeAreaView>
    );
  }
  if (!user) return <Redirect href="/(auth)/onboarding" />;
  // Ya tiene teléfono → no hay nada que pedir.
  if ((user.phone ?? '').trim()) return <Redirect href="/(tabs)" />;

  const save = async () => {
    if (saving) return;
    if (phone.replace(/\D/g, '').length < 10) {
      void showAlert({ title: t('auth.phone'), message: t('auth.enterPhone') });
      return;
    }
    setSaving(true);
    try {
      await usersService.updateProfile(user.uid, { phone: phone.trim() });
      useAuthStore.getState().setUser({ ...user, phone: phone.trim() });
      router.replace('/(tabs)');
    } catch {
      void showAlert({ title: t('common.error'), message: t('checkout.errorMsg') });
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1 justify-center px-6 gap-7">
        <View className="items-center gap-3">
          <View className="bg-primary-container w-16 h-16 rounded-full items-center justify-center">
            <Icon name="call" color={palette.onPrimaryContainer} size={30} />
          </View>
          <Text className="text-2xl font-bold text-on-background text-center">
            {t('phoneStep.title')}
          </Text>
          <Text className="text-on-surface-variant text-center leading-5">
            {t('phoneStep.sub')}
          </Text>
        </View>

        <View className="relative justify-center">
          <View className="absolute left-4 z-10">
            <Icon name="call" color={palette.outline} size={22} />
          </View>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder={t('checkout.contactPhoneHint')}
            placeholderTextColor={palette.outline}
            keyboardType="phone-pad"
            autoFocus
            className="h-14 pl-12 pr-4 bg-surface-container rounded-2xl text-base text-on-surface"
          />
        </View>

        <TouchableOpacity
          onPress={save}
          disabled={saving}
          activeOpacity={0.9}
          className="h-14 bg-primary rounded-full items-center justify-center"
          style={saving ? { opacity: 0.6 } : undefined}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-base">{t('phoneStep.save')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
