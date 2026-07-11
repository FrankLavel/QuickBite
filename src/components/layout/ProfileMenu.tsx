/**
 * ProfileMenu.tsx
 * Micromenú al pulsar el avatar: perfil, configuración, cerrar sesión.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { UserAvatar, getProfileAvatarUri } from '../UserAvatar';
import { colors, radius, shadows, spacing, typography } from '../../utils/theme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  restaurantName?: string;
  logoUri?: string | null;
  photoUri?: string | null;
  email?: string;
  onEditProfile: () => void;
  onLogout: () => void;
}

interface MenuItem {
  key: string;
  label: string;
  icon: FeatherIconName;
  onPress: () => void;
  danger?: boolean;
}

export function ProfileMenu({
  visible,
  onClose,
  userName = '',
  restaurantName = '',
  logoUri,
  photoUri,
  email,
  onEditProfile,
  onLogout,
}: ProfileMenuProps) {
  const avatarUri = getProfileAvatarUri(
    logoUri ?? undefined,
    photoUri ?? undefined
  );
  const displayName = restaurantName || userName || 'Mi restaurante';

  const items: MenuItem[] = [
    {
      key: 'edit',
      label: 'Editar perfil',
      icon: 'edit-2',
      onPress: () => {
        onClose();
        onEditProfile();
      },
    },
    {
      key: 'settings',
      label: 'Configuración',
      icon: 'settings',
      onPress: () => {
        onClose();
        onEditProfile();
      },
    },
    {
      key: 'logout',
      label: 'Cerrar sesión',
      icon: 'log-out',
      onPress: () => {
        onClose();
        onLogout();
      },
      danger: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.menu}>
          <View style={styles.header}>
            <UserAvatar
              name={displayName}
              imageUri={avatarUri}
              size={48}
            />
            <View style={styles.headerText}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              {userName && restaurantName && userName !== restaurantName ? (
                <Text style={styles.sub} numberOfLines={1}>
                  {userName}
                </Text>
              ) : null}
              {email ? (
                <Text style={styles.email} numberOfLines={1}>
                  {email}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          {items.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.item}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Feather
                name={item.icon}
                size={18}
                color={item.danger ? colors.danger : colors.textSecondary}
              />
              <Text
                style={[styles.itemLabel, item.danger && styles.itemDanger]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingTop: 56,
    paddingRight: spacing.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 41, 55, 0.25)',
  },
  menu: {
    width: 260,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 2,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerText: { flex: 1, minWidth: 0 },
  name: {
    ...typography.h3,
    color: colors.text,
  },
  sub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  email: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  itemLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  itemDanger: {
    color: colors.danger,
    fontWeight: '600',
  },
});
