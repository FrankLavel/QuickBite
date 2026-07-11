import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { palette } from '@/constants/colors';
import { authService } from '@/services/auth.service';
import { useTranslation } from '@/hooks/useTranslation';

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 4 },
};

/** Mapea errores de Firebase Auth a claves i18n para esta pantalla. */
function authErrorKey(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'security.wrongCurrent';
    case 'auth/weak-password':
      return 'security.weakNew';
    default:
      return 'security.genericError';
  }
}

export default function SecurityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const hasPassword = authService.hasPasswordProvider();

  // Cambiar contraseña
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changed, setChanged] = useState(false);

  // Eliminar cuenta
  const [deletePw, setDeletePw] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);

  const inputClass = 'h-12 px-4 bg-surface-container-low rounded-xl text-base text-on-surface';

  const changePassword = async () => {
    if (changing) return;
    setChangeError('');
    setChanged(false);
    if (!current || next.length < 6) {
      setChangeError(t('security.weakNew'));
      return;
    }
    if (next !== confirm) {
      setChangeError(t('security.passwordMismatch'));
      return;
    }
    setChanging(true);
    try {
      await authService.changePassword(current, next);
      setChanged(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e: any) {
      setChangeError(t(authErrorKey(e?.code ?? '')));
    } finally {
      setChanging(false);
    }
  };

  const doDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await authService.deleteAccount(hasPassword ? deletePw : undefined);
      setConfirmVisible(false);
      router.replace('/(auth)/login');
    } catch (e: any) {
      const code = e?.code ?? e?.message ?? '';
      setDeleteError(code === 'auth/wrong-password' || code === 'auth/invalid-credential'
        ? t('security.wrongCurrent')
        : t('security.deleteError'));
      setConfirmVisible(false);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteConfirm = () => {
    setDeleteError('');
    if (hasPassword && !deletePw) {
      setDeleteError(t('security.deleteNeedPassword'));
      return;
    }
    setConfirmVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Top App Bar */}
      <View className="flex-row items-center gap-2 px-4 py-2 bg-background">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="p-2 rounded-full"
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Icon name="arrow-back" color={palette.primary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-on-surface">{t('security.title')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 py-6 gap-6"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* Cambiar contraseña */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-primary px-1">{t('security.changePassword')}</Text>
          {hasPassword ? (
            <View className="bg-surface-container-lowest rounded-xl p-4 gap-3" style={cardShadow}>
              <TextInput
                value={current}
                onChangeText={setCurrent}
                placeholder={t('security.currentPassword')}
                placeholderTextColor={palette.outline}
                secureTextEntry
                className={inputClass}
              />
              <TextInput
                value={next}
                onChangeText={setNext}
                placeholder={t('security.newPassword')}
                placeholderTextColor={palette.outline}
                secureTextEntry
                className={inputClass}
              />
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder={t('security.confirmPassword')}
                placeholderTextColor={palette.outline}
                secureTextEntry
                className={inputClass}
              />
              {!!changeError && <Text className="text-error text-sm px-1">{changeError}</Text>}
              {changed && <Text className="text-primary text-sm px-1">{t('security.changed')}</Text>}
              <TouchableOpacity
                onPress={changePassword}
                disabled={changing}
                className="h-12 rounded-full bg-primary items-center justify-center mt-1"
                style={changing ? { opacity: 0.6 } : undefined}
              >
                {changing ? (
                  <ActivityIndicator color={palette.onPrimary} />
                ) : (
                  <Text className="text-on-primary font-bold">{t('security.changeBtn')}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-surface-container-lowest rounded-xl p-4 flex-row items-center gap-3" style={cardShadow}>
              <Icon name="info" color={palette.onSurfaceVariant} />
              <Text className="text-sm text-on-surface-variant flex-1">{t('security.googleNote')}</Text>
            </View>
          )}
        </View>

        {/* Eliminar cuenta */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-error px-1">{t('security.deleteTitle')}</Text>
          <View className="bg-surface-container-lowest rounded-xl p-4 gap-3 border border-error/30" style={cardShadow}>
            <Text className="text-sm text-on-surface-variant">{t('security.deleteDesc')}</Text>
            {hasPassword && (
              <TextInput
                value={deletePw}
                onChangeText={setDeletePw}
                placeholder={t('security.deletePasswordLabel')}
                placeholderTextColor={palette.outline}
                secureTextEntry
                className={inputClass}
              />
            )}
            {!!deleteError && <Text className="text-error text-sm px-1">{deleteError}</Text>}
            <TouchableOpacity
              onPress={openDeleteConfirm}
              disabled={deleting}
              className="h-12 rounded-full border border-error items-center justify-center flex-row gap-2"
              style={deleting ? { opacity: 0.6 } : undefined}
            >
              {deleting ? (
                <ActivityIndicator color={palette.error} />
              ) : (
                <>
                  <Icon name="delete-forever" color={palette.error} size={18} />
                  <Text className="text-error font-bold">{t('security.deleteBtn')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmVisible}
        title={t('security.deleteConfirmTitle')}
        message={t('security.deleteConfirmMsg')}
        confirmLabel={t('security.deleteConfirmBtn')}
        cancelLabel={t('common.cancel')}
        onConfirm={doDelete}
        onCancel={() => setConfirmVisible(false)}
        destructive
        loading={deleting}
      />
    </SafeAreaView>
  );
}
