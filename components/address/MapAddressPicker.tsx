import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useTranslation } from '@/hooks/useTranslation';

export interface PickedAddress {
  street: string;
  city: string;
  coords: { lat: number; lng: number };
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (address: PickedAddress) => void;
}

// Región por defecto (CDMX) si aún no hay ubicación.
const DEFAULT_REGION: Region = {
  latitude: 19.4326,
  longitude: -99.1332,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

function fromGeocode(g: Location.LocationGeocodedAddress): { street: string; city: string } {
  const street = [g.street ?? g.name, g.streetNumber].filter(Boolean).join(' ').trim();
  const city = g.city ?? g.district ?? g.subregion ?? g.region ?? '';
  return { street, city };
}

export function MapAddressPicker({ visible, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);
  const region = useRef<Region>(DEFAULT_REGION);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [resolving, setResolving] = useState(false);
  const [address, setAddress] = useState<{ street: string; city: string } | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [ready, setReady] = useState(false);

  // Al abrir, centra en la ubicación actual si hay permiso.
  useEffect(() => {
    if (!visible) {
      setReady(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          if (!active) return;
          region.current = {
            ...DEFAULT_REGION,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        }
      } catch {
        // usa la región por defecto
      } finally {
        if (active) {
          setReady(true);
          resolveCenter(region.current);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [visible]);

  const resolveCenter = async (r: Region) => {
    setResolving(true);
    try {
      const [g] = await Location.reverseGeocodeAsync({
        latitude: r.latitude,
        longitude: r.longitude,
      });
      setAddress(g ? fromGeocode(g) : null);
    } catch {
      setAddress(null);
    } finally {
      setResolving(false);
    }
  };

  const onRegionChangeComplete = (r: Region) => {
    region.current = r;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => resolveCenter(r), 400);
  };

  const goToMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('address.permTitle'), t('address.permMsg'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const next: Region = {
        ...DEFAULT_REGION,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      mapRef.current?.animateToRegion(next, 500);
    } catch {
      Alert.alert(t('common.error'), t('address.locError'));
    }
  };

  const searchAddress = async () => {
    if (searching || !query.trim()) return;
    setSearching(true);
    try {
      const [geo] = await Location.geocodeAsync(query.trim());
      if (!geo) {
        Alert.alert(t('address.noResultsTitle'), t('address.noResultsMsg'));
        return;
      }
      const next: Region = {
        ...DEFAULT_REGION,
        latitude: geo.latitude,
        longitude: geo.longitude,
      };
      mapRef.current?.animateToRegion(next, 500);
    } catch {
      Alert.alert(t('common.error'), t('address.searchError'));
    } finally {
      setSearching(false);
    }
  };

  const confirm = () => {
    onConfirm({
      street: address?.street ?? '',
      city: address?.city ?? '',
      coords: { lat: region.current.latitude, lng: region.current.longitude },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        {ready ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={region.current}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={palette.primary} />
          </View>
        )}

        {/* Pin central fijo */}
        {ready && (
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <View style={{ marginTop: -32 }}>
              <Icon name="location-on" color={palette.primary} size={48} />
            </View>
          </View>
        )}

        {/* Header + búsqueda */}
        <SafeAreaView edges={['top']} className="absolute top-0 left-0 w-full px-4 gap-2">
          <View className="flex-row items-center gap-2 mt-2">
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 bg-white rounded-full items-center justify-center"
              style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Icon name="arrow-back" color={palette.onSurface} />
            </TouchableOpacity>
            <View
              className="flex-1 flex-row items-center bg-white rounded-full px-4 h-12"
              style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
            >
              <Icon name="search" color={palette.outline} size={20} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={searchAddress}
                placeholder={t('map.search')}
                placeholderTextColor={palette.outline}
                returnKeyType="search"
                className="flex-1 ml-2 text-base text-on-surface"
              />
              {searching && <ActivityIndicator color={palette.primary} />}
            </View>
          </View>
        </SafeAreaView>

        {/* FAB mi ubicación */}
        {ready && (
          <TouchableOpacity
            onPress={goToMyLocation}
            className="absolute right-4 bottom-44 w-12 h-12 bg-white rounded-full items-center justify-center"
            style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}
            accessibilityRole="button"
            accessibilityLabel={t('address.useLocation')}
          >
            <Icon name="my-location" color={palette.primary} />
          </TouchableOpacity>
        )}

        {/* Card inferior: dirección resuelta + confirmar */}
        <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 w-full">
          <View
            className="bg-white rounded-t-3xl p-6 gap-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } }}
          >
            <View className="flex-row items-center gap-3">
              <Icon name="location-on" color={palette.primary} />
              <View className="flex-1">
                <Text className="text-xs text-on-surface-variant">{t('map.deliverHere')}</Text>
                {resolving ? (
                  <Text className="text-base font-bold text-on-surface-variant">{t('map.searching')}</Text>
                ) : (
                  <Text className="text-base font-bold text-on-surface" numberOfLines={2}>
                    {address?.street
                      ? `${address.street}${address.city ? `, ${address.city}` : ''}`
                      : t('map.moveMap')}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={confirm}
              disabled={resolving}
              accessibilityRole="button"
              accessibilityLabel={t('map.confirm')}
              className="h-14 bg-primary rounded-full items-center justify-center"
              style={resolving ? { opacity: 0.5 } : undefined}
            >
              <Text className="text-on-primary font-bold text-base">{t('map.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
