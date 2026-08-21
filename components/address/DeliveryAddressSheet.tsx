import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { showAlert } from '@/store/dialogStore';
import { MapAddressPicker } from '@/components/address/MapAddressPicker';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users.service';
import { useTranslation } from '@/hooks/useTranslation';
import { Address } from '@/types/user.types';
import { reverseGeocode, forwardGeocode } from '@/lib/geocode';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Coords = { lat: number; lng: number };

/** Selector de dirección: lista, predeterminada, agregar (GPS o búsqueda). */
export function DeliveryAddressSheet({ visible, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { t } = useTranslation();
  const addresses = user?.addresses ?? [];

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [references, setReferences] = useState('');
  const [coords, setCoords] = useState<Coords>({ lat: 0, lng: 0 });
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  const persist = async (next: Address[]) => {
    if (!user) return;
    const prev = user.addresses;
    setUser({ ...user, addresses: next });
    try {
      await usersService.setAddresses(user.uid, next);
    } catch {
      setUser({ ...user, addresses: prev });
    }
  };

  const selectDefault = (index: number) =>
    persist(addresses.map((a, i) => ({ ...a, isDefault: i === index })));

  const removeAddress = (index: number) => {
    const wasDefault = addresses[index]?.isDefault;
    const next = addresses.filter((_, i) => i !== index);
    // Solo reasignar la predeterminada si se eliminó la que lo era.
    if (wasDefault && next.length > 0) next[0] = { ...next[0], isDefault: true };
    persist(next);
  };

  const resetForm = () => {
    setLabel('');
    setStreet('');
    setCity('');
    setReferences('');
    setCoords({ lat: 0, lng: 0 });
    setAdding(false);
  };

  // Usa el GPS del dispositivo y rellena los campos por geocodificación inversa.
  const useCurrentLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        void showAlert({ title: t('address.permTitle'), message: t('address.permMsg') });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lng: longitude });
      const resolved = await reverseGeocode(latitude, longitude);
      if (resolved) {
        setStreet(resolved.street);
        setCity(resolved.city);
        if (!label) setLabel(t('address.myLocation'));
      }
    } catch {
      void showAlert({ title: t('common.error'), message: t('address.locError') });
    } finally {
      setLocating(false);
    }
  };

  const saveAddress = async () => {
    if (saving || !street.trim() || !city.trim()) return;
    setSaving(true);
    // Si no hay coords (dirección escrita a mano), intenta geocodificar.
    let finalCoords = coords;
    if (finalCoords.lat === 0 && finalCoords.lng === 0) {
      const geo = await forwardGeocode(`${street.trim()}, ${city.trim()}`);
      if (geo) finalCoords = geo;
    }
    const newAddr: Address = {
      label: label.trim() || t('address.defaultLabel'),
      street: street.trim(),
      city: city.trim(),
      ...(references.trim() ? { references: references.trim() } : {}),
      coords: finalCoords,
      isDefault: true,
    };
    const next = [...addresses.map((a) => ({ ...a, isDefault: false })), newAddr];
    await persist(next);
    setSaving(false);
    resetForm();
  };

  const inputClass =
    'h-12 px-4 bg-surface-container-low rounded-xl text-base text-on-surface';

  return (
    <>
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="gap-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-on-surface">{t('address.title')}</Text>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')}>
            <Icon name="close" color={palette.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {!adding ? (
          <>
            {addresses.length === 0 ? (
              <Text className="text-on-surface-variant">{t('address.none')}</Text>
            ) : (
              <ScrollView className="max-h-72" showsVerticalScrollIndicator={false}>
                <View className="gap-3">
                  {addresses.map((a, i) => {
                    const isDefault = a.isDefault;
                    return (
                      <TouchableOpacity
                        key={`${a.label}-${i}`}
                        onPress={() => selectDefault(i)}
                        activeOpacity={0.85}
                        className="flex-row items-center gap-3 p-4 rounded-xl border"
                        style={{ borderColor: isDefault ? palette.primary : palette.outlineVariant }}
                      >
                        <Icon
                          name={isDefault ? 'radio-button-checked' : 'radio-button-unchecked'}
                          color={isDefault ? palette.primary : palette.outline}
                        />
                        <View className="flex-1">
                          <Text className="text-base font-bold text-on-surface">{a.label}</Text>
                          <Text className="text-sm text-on-surface-variant" numberOfLines={1}>
                            {a.street}, {a.city}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeAddress(i)}
                          className="p-1"
                          accessibilityRole="button"
                          accessibilityLabel={`${t('a11y.delete')}: ${a.label}`}
                        >
                          <Icon name="delete" color={palette.error} size={20} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => setAdding(true)}
              className="flex-row items-center justify-center gap-2 h-12 rounded-full bg-primary-container"
            >
              <Icon name="add" color={palette.onPrimaryContainer} />
              <Text className="text-on-primary-container font-bold">{t('address.addAddress')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View className="gap-3">
            {/* Usar ubicación actual */}
            <TouchableOpacity
              onPress={useCurrentLocation}
              disabled={locating}
              className="flex-row items-center justify-center gap-2 h-12 rounded-xl bg-primary-container"
            >
              {locating ? (
                <ActivityIndicator color={palette.onPrimaryContainer} />
              ) : (
                <>
                  <Icon name="my-location" color={palette.onPrimaryContainer} size={20} />
                  <Text className="text-on-primary-container font-bold">{t('address.useLocation')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Buscar y elegir en el mapa (confirmación visual = precisión) */}
            <TouchableOpacity
              onPress={() => setMapVisible(true)}
              className="flex-row items-center justify-center gap-2 h-12 rounded-xl border border-primary"
              accessibilityRole="button"
              accessibilityLabel={t('address.chooseMap')}
            >
              <Icon name="map" color={palette.primary} size={20} />
              <Text className="text-primary font-bold">{t('address.chooseMap')}</Text>
            </TouchableOpacity>
            <Text className="text-xs text-on-surface-variant text-center px-2">
              {t('address.mapHint')}
            </Text>

            <View className="h-px bg-outline-variant/40 my-1" />

            <TextInput value={label} onChangeText={setLabel} placeholder={t('address.label')} placeholderTextColor={palette.outline} className={inputClass} />
            <TextInput value={street} onChangeText={setStreet} placeholder={t('address.street')} placeholderTextColor={palette.outline} className={inputClass} />
            <TextInput value={city} onChangeText={setCity} placeholder={t('address.city')} placeholderTextColor={palette.outline} className={inputClass} />
            <TextInput value={references} onChangeText={setReferences} placeholder={t('address.references')} placeholderTextColor={palette.outline} className={inputClass} />

            <View className="flex-row gap-3 pt-1">
              <TouchableOpacity
                onPress={resetForm}
                className="flex-1 h-12 rounded-full border border-outline-variant items-center justify-center"
              >
                <Text className="text-on-surface font-bold">{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveAddress}
                disabled={saving || !street.trim() || !city.trim()}
                className="flex-1 h-12 rounded-full bg-primary items-center justify-center"
                style={saving || !street.trim() || !city.trim() ? { opacity: 0.5 } : undefined}
              >
                {saving ? (
                  <ActivityIndicator color={palette.onPrimary} />
                ) : (
                  <Text className="text-on-primary font-bold">{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </BottomSheet>

    <MapAddressPicker
      visible={mapVisible}
      onClose={() => setMapVisible(false)}
      onConfirm={(a) => {
        setStreet(a.street);
        setCity(a.city);
        setCoords(a.coords);
        if (!label) setLabel(t('address.myLocation'));
        setMapVisible(false);
      }}
    />
    </>
  );
}
