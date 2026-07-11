import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users.service';
import { storageService } from '@/services/storage.service';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Edita nombre, teléfono y foto de perfil (elegida del dispositivo → Storage). */
export function EditProfileSheet({ visible, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState(''); // foto remota actual
  const [localUri, setLocalUri] = useState<string | null>(null); // foto recién elegida, sin subir
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sincroniza el formulario al abrir / cambiar de usuario.
  useEffect(() => {
    if (visible && user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
      setPhotoURL(user.photoURL ?? '');
      setLocalUri(null);
      setError('');
    }
  }, [visible, user]);

  const pickImage = async () => {
    setError('');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError(t('editProfile.photoPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.[0]) {
      setLocalUri(result.assets[0].uri);
    }
  };

  const save = async () => {
    if (saving || !user || !name.trim()) return;
    setSaving(true);
    setError('');
    const prev = user;
    let uploadedUrl: string | null = null;
    try {
      // Si se eligió una foto nueva, súbela a Storage y usa su URL.
      if (localUri) uploadedUrl = await storageService.uploadUserAvatar(user.uid, localUri);
      const finalPhoto = uploadedUrl ?? photoURL;

      const data = { name: name.trim(), phone: phone.trim(), photoURL: finalPhoto };
      setUser({ ...user, ...data }); // optimista
      await usersService.updateProfile(user.uid, data);
      onClose();
    } catch {
      setUser(prev); // revierte el cambio optimista
      // Si ya se había subido la foto pero falló guardar, evita dejarla huérfana.
      if (uploadedUrl) storageService.deleteByUrl(uploadedUrl);
      setError(t('editProfile.uploadError'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'h-12 px-4 bg-surface-container-low rounded-xl text-base text-on-surface';
  const avatarSource = localUri ?? (photoURL.trim() || null);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-on-surface">{t('editProfile.title')}</Text>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')}>
            <Icon name="close" color={palette.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Avatar seleccionable */}
        <View className="items-center gap-2">
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8} disabled={saving}>
            <View className="w-24 h-24 rounded-full overflow-hidden bg-surface-container items-center justify-center">
              {avatarSource ? (
                <Image source={{ uri: avatarSource }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Icon name="person" color={palette.outline} size={44} />
              )}
            </View>
            {/* Badge de cámara */}
            <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-surface-container-lowest">
              <Icon name="photo-camera" color={palette.onPrimary} size={16} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} disabled={saving}>
            <Text className="text-sm font-semibold text-primary">{t('editProfile.changePhoto')}</Text>
          </TouchableOpacity>
        </View>

        <View className="gap-1">
          <Text className="text-sm font-semibold text-on-surface-variant px-1">{t('editProfile.name')}</Text>
          <TextInput value={name} onChangeText={setName} placeholder={t('editProfile.yourName')} placeholderTextColor={palette.outline} className={inputClass} />
        </View>

        <View className="gap-1">
          <Text className="text-sm font-semibold text-on-surface-variant px-1">{t('editProfile.phone')}</Text>
          <TextInput value={phone} onChangeText={setPhone} placeholder={t('editProfile.optional')} placeholderTextColor={palette.outline} keyboardType="phone-pad" className={inputClass} />
        </View>

        {!!error && <Text className="text-sm text-error px-1">{error}</Text>}

        <View className="flex-row gap-3 pt-1">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 h-12 rounded-full border border-outline-variant items-center justify-center"
          >
            <Text className="text-on-surface font-bold">{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={save}
            disabled={saving || !name.trim()}
            className="flex-1 h-12 rounded-full bg-primary items-center justify-center"
            style={saving || !name.trim() ? { opacity: 0.5 } : undefined}
          >
            {saving ? <ActivityIndicator color={palette.onPrimary} /> : <Text className="text-on-primary font-bold">{t('common.save')}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}
