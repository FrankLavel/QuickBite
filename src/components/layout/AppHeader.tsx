/**
 * components/layout/AppHeader.tsx
 * Encabezado: menú, búsqueda, estado abierto, avatar con micromenú.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { isRestaurantOpenNow } from '../../utils/schedule';
import { useAuth } from '../../hooks/useAuth';
import { UserAvatar, getProfileAvatarUri } from '../UserAvatar';
import { ProfileMenu } from './ProfileMenu';

interface AppHeaderProps {
  onMenuPress: () => void;
  showMenuButton?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (text: string) => void;
  onEditProfile?: () => void;
  onPreferences?: () => void;
  onLogout?: () => void;
}

export function AppHeader({
  onMenuPress,
  showMenuButton = true,
  searchPlaceholder = 'Buscar pedidos, menús o clientes...',
  onSearchChange,
  onEditProfile,
  onPreferences,
  onLogout,
}: AppHeaderProps) {
  const { restaurant, user, updateProfile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Modo: automático (respeta el horario) por defecto; manual = el interruptor manda.
  const auto = restaurant?.autoSchedule !== false;
  // Estado efectivo que ve el cliente (según el modo).
  const effectiveOpen = restaurant ? isRestaurantOpenNow(restaurant) : false;

  // Solo en modo MANUAL: abre/cierra al instante. Escribe en Firestore, por lo
  // que la app del cliente lo refleja en tiempo real.
  const toggleOpen = async () => {
    if (toggling || !restaurant || auto) return;
    setToggling(true);
    try {
      await updateProfile(undefined, { isOpen: !(restaurant.isOpen !== false) });
    } catch {
      // updateProfile maneja el error; evitamos que truene el toque.
    } finally {
      setToggling(false);
    }
  };

  // Cambia entre automático (por horario) y manual (interruptor). Al pasar a
  // manual, arranca desde el estado efectivo actual para que no dé un salto.
  const toggleMode = async () => {
    if (toggling || !restaurant) return;
    setToggling(true);
    try {
      await updateProfile(
        undefined,
        auto ? { autoSchedule: false, isOpen: effectiveOpen } : { autoSchedule: true }
      );
    } catch {
      // manejado en updateProfile
    } finally {
      setToggling(false);
    }
  };

  const avatarUri = getProfileAvatarUri(
    restaurant?.coverImage,
    user?.photoURL
  );
  const displayName = restaurant?.name ?? user?.name ?? 'R';

  return (
    <View style={styles.container}>
      {showMenuButton ? (
        <Pressable
          style={({ pressed }) => [
            styles.menuBtn,
            pressed && styles.menuBtnPressed,
          ]}
          onPress={onMenuPress}
          accessibilityLabel="Abrir menú de navegación"
        >
          <Feather name="menu" size={22} color={colors.text} />
        </Pressable>
      ) : (
        <View style={styles.menuSpacer} />
      )}

      {/* La búsqueda solo se muestra si la pantalla la implementa, para no
          ofrecer un campo que no filtra nada. */}
      {onSearchChange ? (
        <View style={styles.search}>
          <Feather
            name="search"
            size={18}
            color={colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textMuted}
            onChangeText={onSearchChange}
          />
        </View>
      ) : (
        <View style={styles.searchSpacer} />
      )}

      <View style={styles.statusWrap}>
        {auto ? (
          // Automático: estado calculado por el horario (no se toca a mano).
          <View
            style={[styles.status, effectiveOpen ? styles.statusOpen : styles.statusClosed]}
          >
            <View style={[styles.dot, effectiveOpen ? styles.dotOpen : styles.dotClosed]} />
            <Text style={styles.statusText}>{effectiveOpen ? 'Abierto' : 'Cerrado'}</Text>
          </View>
        ) : (
          // Manual: el interruptor manda; un toque abre/cierra.
          <Pressable
            onPress={toggleOpen}
            disabled={toggling}
            accessibilityRole="button"
            accessibilityLabel={effectiveOpen ? 'Cerrar restaurante' : 'Abrir restaurante'}
            style={({ pressed }) => [
              styles.status,
              effectiveOpen ? styles.statusOpen : styles.statusClosed,
              (pressed || toggling) && styles.statusPressed,
            ]}
          >
            <View style={[styles.dot, effectiveOpen ? styles.dotOpen : styles.dotClosed]} />
            <Text style={styles.statusText}>{effectiveOpen ? 'Abierto' : 'Cerrado'}</Text>
            <Feather name="power" size={12} color={colors.textMuted} />
          </Pressable>
        )}

        <Pressable
          onPress={toggleMode}
          disabled={toggling}
          accessibilityRole="button"
          accessibilityLabel={
            auto ? 'Cambiar a modo manual' : 'Cambiar a modo automático (por horario)'
          }
          style={({ pressed }) => [
            styles.modeChip,
            (pressed || toggling) && styles.statusPressed,
          ]}
        >
          <Feather
            name={auto ? 'clock' : 'sliders'}
            size={12}
            color={colors.primary}
          />
          <Text style={styles.modeText}>{auto ? 'Auto' : 'Manual'}</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.profile,
          pressed && styles.profilePressed,
        ]}
        onPress={() => setMenuOpen(true)}
        accessibilityLabel="Menú de cuenta"
      >
        <UserAvatar name={displayName} imageUri={avatarUri} size={40} />
        <Feather
          name="chevron-down"
          size={14}
          color={colors.textMuted}
          style={styles.chevron}
        />
      </Pressable>

      <ProfileMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        userName={user?.name}
        restaurantName={restaurant?.name}
        logoUri={restaurant?.coverImage}
        photoUri={user?.photoURL}
        email={user?.email}
        onEditProfile={() => onEditProfile?.()}
        onPreferences={() => onPreferences?.()}
        onLogout={() => onLogout?.()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnPressed: {
    backgroundColor: colors.primarySoft,
  },
  menuSpacer: { width: 4 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchSpacer: { flex: 1 },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.text,
    paddingVertical: 8,
    outlineStyle: 'none',
  } as object,
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  modeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  statusOpen: { backgroundColor: colors.successSoft },
  statusClosed: { backgroundColor: colors.dangerSoft },
  statusPressed: { opacity: 0.6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOpen: { backgroundColor: colors.success },
  dotClosed: { backgroundColor: colors.danger },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 2,
    paddingRight: 4,
    borderRadius: radius.full,
  },
  profilePressed: {
    backgroundColor: colors.primarySoft,
  },
  chevron: { marginLeft: 2 },
});
