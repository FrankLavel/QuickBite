/**
 * screens/dashboard/SettingsScreen.tsx
 * Configuración del restaurante: identidad de marca, responsable, horarios,
 * estado del local y operaciones de entrega. Layout de dos columnas coherente
 * con el resto del dashboard y feedback inline (compatible con web).
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { SectionCard } from '../../components/SectionCard';
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
import { geocodeAddress } from '../../services/geocode';

type Feedback = { type: 'success' | 'error'; text: string } | null;

export function SettingsScreen() {
  const { user, restaurant, updateProfile, logout } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;

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
  const [geocoding, setGeocoding] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

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
    setFeedback(null);

    if (!restaurantName.trim()) {
      setFeedback({
        type: 'error',
        text: 'El nombre del restaurante es obligatorio.',
      });
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
        setFeedback({
          type: 'error',
          text: 'Ubicación inválida: latitud (-90 a 90) y longitud (-180 a 180) deben ser números válidos, o deja ambos campos vacíos.',
        });
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
      setFeedback({
        type: 'success',
        text: 'Perfil del restaurante guardado correctamente.',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo guardar el perfil';
      setFeedback({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleGeocode = async () => {
    setFeedback(null);
    if (!address.trim()) {
      setFeedback({
        type: 'error',
        text: 'Escribe primero la dirección para obtener sus coordenadas.',
      });
      return;
    }
    setGeocoding(true);
    try {
      const result = await geocodeAddress(address);
      if (!result) {
        setFeedback({
          type: 'error',
          text: 'No se encontró la dirección. Revisa que esté completa (calle, número, ciudad y estado).',
        });
        return;
      }
      setLatitude(result.lat.toFixed(6));
      setLongitude(result.lng.toFixed(6));
      setFeedback({
        type: 'success',
        text: 'Coordenadas obtenidas de la dirección. Revisa que el punto sea correcto y guarda los cambios.',
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudieron obtener las coordenadas.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setGeocoding(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirmAction(
      'Cerrar sesión',
      '¿Salir de QuickBite?',
      { confirmText: 'Salir', cancelText: 'Cancelar', destructive: true }
    );
    if (confirmed) await logout();
  };

  return (
    <ScreenShell searchPlaceholder="Buscar en configuración...">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.pageHead}>
          <View style={styles.pageHeadText}>
            <Text style={styles.title}>Configuración</Text>
            <Text style={styles.subtitle}>
              Identidad de marca, horarios y operaciones del local
            </Text>
          </View>
          <Button
            title="Guardar cambios"
            onPress={handleSave}
            loading={saving}
            style={styles.headSave}
          />
        </View>

        {feedback ? (
          <View
            style={[
              styles.banner,
              feedback.type === 'success'
                ? styles.bannerSuccess
                : styles.bannerError,
            ]}
          >
            <Feather
              name={feedback.type === 'success' ? 'check-circle' : 'alert-circle'}
              size={16}
              color={feedback.type === 'success' ? colors.success : colors.danger}
            />
            <Text
              style={[
                styles.bannerText,
                {
                  color:
                    feedback.type === 'success'
                      ? colors.success
                      : colors.danger,
                },
              ]}
            >
              {feedback.text}
            </Text>
          </View>
        ) : null}

        <View style={[styles.columns, wide && styles.columnsRow]}>
          {/* Columna principal: marca, responsable y horarios */}
          <View style={wide ? styles.colMain : undefined}>
            <SectionCard
              title="Identidad de marca"
              subtitle="Cómo te ven los clientes en la app"
            >
              <AvatarPicker
                name={restaurantName || name}
                value={avatar}
                onChange={setAvatar}
              />
              <CoverPicker value={cover} onChange={setCover} />
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
            </SectionCard>

            <SectionCard
              title="Horarios de atención"
              subtitle="Días y horas en que recibes pedidos"
              style={styles.stack}
            >
              <ScheduleEditor value={schedule} onChange={setSchedule} />
            </SectionCard>
          </View>

          {/* Columna lateral: estado y operaciones */}
          <View style={wide ? styles.colSide : undefined}>
            <View
              style={[
                styles.statusCard,
                isOpen ? styles.statusOpen : styles.statusClosed,
              ]}
            >
              <View
                style={[
                  styles.statusIcon,
                  {
                    backgroundColor: isOpen
                      ? colors.primary
                      : colors.danger,
                  },
                ]}
              >
                <Feather
                  name={isOpen ? 'unlock' : 'lock'}
                  size={18}
                  color={colors.textOnPrimary}
                />
              </View>
              <View style={styles.statusText}>
                <Text style={styles.statusTitle}>
                  {isOpen ? 'Abierto' : 'Cerrado'}
                </Text>
                <Text style={styles.statusDesc}>
                  {isOpen
                    ? 'Aceptando pedidos en la app'
                    : 'No se muestran pedidos nuevos'}
                </Text>
              </View>
              <Switch
                value={isOpen}
                onValueChange={setIsOpen}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={isOpen ? colors.primary : colors.textMuted}
              />
            </View>

            <SectionCard
              title="Datos del responsable"
              subtitle="Contacto interno de la cuenta"
              style={styles.stack}
            >
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
            </SectionCard>

            <SectionCard
              title="Operaciones de entrega"
              subtitle="Tarifas y cobertura del servicio"
              style={styles.stack}
            >
              <InputField
                label="Tiempo de entrega"
                value={deliveryTime}
                onChangeText={setDeliveryTime}
                placeholder="25-35 min"
              />
              <InputField
                label="Tarifa de envío (MXN)"
                value={deliveryFee}
                onChangeText={setDeliveryFee}
                keyboardType="decimal-pad"
              />
              <InputField
                label="Pedido mínimo (MXN)"
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
            </SectionCard>

            <SectionCard
              title="Ubicación del local"
              subtitle="Para el mapa y la distancia de reparto en la app"
              style={styles.stack}
            >
              <TouchableOpacity
                style={[styles.geoBtn, geocoding && styles.geoBtnDisabled]}
                onPress={handleGeocode}
                disabled={geocoding}
                activeOpacity={0.85}
              >
                <Feather
                  name={geocoding ? 'loader' : 'map-pin'}
                  size={15}
                  color={colors.primary}
                />
                <Text style={styles.geoBtnText}>
                  {geocoding
                    ? 'Buscando…'
                    : 'Obtener coordenadas de la dirección'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.geoHint}>
                Se calculan solas desde la dirección de arriba. También puedes
                ajustarlas a mano.
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
            </SectionCard>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Guardar cambios"
            onPress={handleSave}
            loading={saving}
            style={styles.footerSave}
          />
          <Button
            title="Cerrar sesión"
            variant="outline"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  pageHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  pageHeadText: { flex: 1, minWidth: 220 },
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  headSave: { minWidth: 160 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bannerSuccess: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  bannerError: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  bannerText: { ...typography.bodySmall, fontWeight: '600', flex: 1 },
  columns: { gap: spacing.md },
  columnsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  colMain: { flex: 2, gap: spacing.md },
  colSide: { flex: 1, minWidth: 300, gap: spacing.md },
  stack: {},
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.card,
  },
  statusOpen: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  statusClosed: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { flex: 1 },
  statusTitle: { ...typography.h3, color: colors.text, fontWeight: '800' },
  statusDesc: { ...typography.caption, color: colors.textSecondary },
  geoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.primarySoft,
  },
  geoBtnDisabled: { opacity: 0.6 },
  geoBtnText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  geoHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  coordsRow: { flexDirection: 'row', gap: spacing.md },
  coordField: { flex: 1 },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  footerSave: { flex: 1, minWidth: 180 },
});
