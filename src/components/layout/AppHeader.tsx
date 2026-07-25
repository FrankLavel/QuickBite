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
  const { restaurant, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOpen = restaurant?.isOpen !== false;

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

      <View
        style={[styles.status, isOpen ? styles.statusOpen : styles.statusClosed]}
      >
        <View style={[styles.dot, isOpen ? styles.dotOpen : styles.dotClosed]} />
        <Text style={styles.statusText}>{isOpen ? 'Abierto' : 'Cerrado'}</Text>
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
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  statusOpen: { backgroundColor: colors.successSoft },
  statusClosed: { backgroundColor: colors.dangerSoft },
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
