/**
 * screens/dashboard/SettingsScreen.tsx
 * Perfil del restaurante + avatar/logo editable.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { InputField } from '../../components/InputField';
import { Button } from '../../components/Button';
import { AvatarPicker, type AvatarPickerValue } from '../../components/AvatarPicker';
import { CoverPicker, type CoverPickerValue } from '../../components/CoverPicker';
import { CuisineSelector } from '../../components/CuisineSelector';
import { ScheduleEditor } from '../../components/ScheduleEditor';
import { GeoPoint } from 'firebase/firestore';
import type { WeekSchedule, Restaurant } from '../../types/restaurant';
import { useAuth } from '../../hooks/useAuth';
import { colors, radius, shadows, spacing, typography } from '../../utils/theme';
import { confirmAction } from '../../utils/confirm';
import { getProfileAvatarUri } from '../../components/UserAvatar';

export function SettingsScreen() {
  const { user, restaurant, updateProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [restaurantName, setRestaurantName] = useState(restaurant?.name ?? '');
  const [description, setDescription] = useState(restaurant?.description ?? '');
  const [address, setAddress] = useState(restaurant?.address ?? '');
  const [deliveryTime, setDeliveryTime] = useState(
    restaurant?.deliveryTime ?? '25-35 min'
  );
  const [deliveryFee, setDeliveryFee] = useState(
    String(restaurant?.deliveryFee ?? 0)
  );
  const [minOrder, setMinOrder] = useState(String(restaurant?.minOrder ?? 0));
  const [deliveryZone, setDeliveryZone] = useState(
    String(restaurant?.deliveryZone ?? 5)
  );
  const [isOpen, setIsOpen] = useState(restaurant?.isOpen !== false);
  const [avatar, setAvatar] = useState<AvatarPickerValue>({
    previewUri: null,
    imageURL: '',
  });
  const [cover, setCover] = useState<CoverPickerValue>({
    previewUri: null,
    imageURL: '',
  });
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<WeekSchedule>({});
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const uri = getProfileAvatarUri(restaurant?.logoImage, user?.photoURL);
    setAvatar({
      previewUri: uri,
      imageURL: restaurant?.logoImage ?? user?.photoURL ?? '',
    });
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setRestaurantName(restaurant?.name ?? '');
    setDescription(restaurant?.description ?? '');
    setAddress(restaurant?.address ?? '');
    setDeliveryTime(restaurant?.deliveryTime ?? '25-35 min');
    setDeliveryFee(String(restaurant?.deliveryFee ?? 0));
    setMinOrder(String(restaurant?.minOrder ?? 0));
    setDeliveryZone(String(restaurant?.deliveryZone ?? 5));
    setIsOpen(restaurant?.isOpen !== false);
    setCover({
      previewUri: restaurant?.coverImage || null,
      imageURL: restaurant?.coverImage ?? '',
    });
    setCuisineTypes(restaurant?.cuisineTypes ?? []);
    setSchedule(restaurant?.schedule ?? {});
    setLatitude(
      restaurant?.location?.latitude != null
        ? String(restaurant.location.latitude)
        : ''
    );
    setLongitude(
      restaurant?.location?.longitude != null
        ? String(restaurant.location.longitude)
        : ''
    );
  }, [user, restaurant]);

  const handleSave = async () => {
    if (!restaurantName.trim()) {
      Alert.alert('Validación', 'El nombre del restaurante es obligatorio');
      return;
    }

    const latTrim = latitude.trim();
    const lngTrim = longitude.trim();
    let location: GeoPoint | undefined;
    if (latTrim !== '' || lngTrim !== '') {
      const lat = parseFloat(latTrim);
      const lng = parseFloat(lngTrim);
      if (
        Number.isNaN(lat) ||
        Number.isNaN(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        Alert.alert(
          'Ubicación inválida',
          'Latitud (-90 a 90) y longitud (-180 a 180) deben ser números válidos, o deja ambos campos vacíos.'
        );
        return;
      }
      location = new GeoPoint(lat, lng);
    }

    const restaurantUpdates: Partial<Restaurant> = {
      name: restaurantName.trim(),
      description: description.trim(),
      address: address.trim(),
      deliveryTime: deliveryTime.trim(),
      deliveryFee: parseFloat(deliveryFee) || 0,
      minOrder: parseFloat(minOrder) || 0,
      deliveryZone: parseFloat(deliveryZone) || 5,
      isOpen,
      cuisineTypes,
      schedule,
    };
    // Solo escribimos location si el usuario capturó coordenadas válidas.
    if (location) {
      restaurantUpdates.location = location;
    }

    setSaving(true);
    try {
      await updateProfile(
        { name: name.trim(), phone: phone.trim() },
        restaurantUpdates,
        {
          localLogoUri: avatar.localUri,
          logoImageURL: avatar.imageURL,
          localCoverUri: cover.localUri,
          coverImageURL: cover.imageURL,
        }
      );
      Alert.alert('Listo', 'Perfil del restaurante guardado correctamente');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo guardar el perfil';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell searchPlaceholder="Buscar en configuración...">
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Perfil del restaurante</Text>
        <Text style={styles.subtitle}>
          Avatar, identidad de marca y operaciones del local
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Avatar y marca</Text>
          <AvatarPicker
            name={restaurantName || name}
            value={avatar}
            onChange={setAvatar}
          />
          <CoverPicker value={cover} onChange={setCover} />
          <InputField
            label="Nombre del responsable"
            value={name}
            onChangeText={setName}
          />
          <InputField
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <InputField
            label="Nombre del restaurante"
            value={restaurantName}
            onChangeText={setRestaurantName}
          />
          <InputField
            label="Descripción / eslogan"
            value={description}
            onChangeText={setDescription}
            multiline
            style={styles.multiline}
          />
          <InputField
            label="Dirección"
            value={address}
            onChangeText={setAddress}
          />
          <CuisineSelector value={cuisineTypes} onChange={setCuisineTypes} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Horarios de atención</Text>
          <ScheduleEditor value={schedule} onChange={setSchedule} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Operaciones del local</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {isOpen
                ? 'Aceptando pedidos (Abierto)'
                : 'No acepta pedidos (Cerrado)'}
            </Text>
            <Switch
              value={isOpen}
              onValueChange={setIsOpen}
              trackColor={{ false: colors.border, true: colors.primarySoft }}
              thumbColor={isOpen ? colors.primary : colors.textMuted}
            />
          </View>
          <InputField
            label="Tiempo de entrega"
            value={deliveryTime}
            onChangeText={setDeliveryTime}
            placeholder="25-35 min"
          />
          <InputField
            label="Tarifa de envío ($)"
            value={deliveryFee}
            onChangeText={setDeliveryFee}
            keyboardType="decimal-pad"
          />
          <InputField
            label="Pedido mínimo ($)"
            value={minOrder}
            onChangeText={setMinOrder}
            keyboardType="decimal-pad"
          />
          <InputField
            label="Zona de entrega (km)"
            value={deliveryZone}
            onChangeText={setDeliveryZone}
            keyboardType="decimal-pad"
          />

          <Text style={styles.sectionHint}>
            Ubicación del local (opcional, para mapa y distancia en la app)
          </Text>
          <View style={styles.coordsRow}>
            <View style={styles.coordField}>
              <InputField
                label="Latitud"
                value={latitude}
                onChangeText={setLatitude}
                placeholder="19.4326"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.coordField}>
              <InputField
                label="Longitud"
                value={longitude}
                onChangeText={setLongitude}
                placeholder="-99.1332"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </View>

        <Button title="Guardar perfil" onPress={handleSave} loading={saving} />
        <Button
          title="Cerrar sesión"
          variant="outline"
          onPress={async () => {
            const confirmed = await confirmAction(
              'Cerrar sesión',
              '¿Salir de QuickBite?',
              { confirmText: 'Salir', cancelText: 'Cancelar', destructive: true }
            );
            if (confirmed) await logout();
          }}
          style={styles.logout}
        />
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  switchLabel: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  coordsRow: { flexDirection: 'row', gap: spacing.md },
  coordField: { flex: 1 },
  logout: { marginTop: spacing.md },
});
