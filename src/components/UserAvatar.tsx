/**
 * UserAvatar.tsx
 * Avatar del restaurante / usuario con imagen o inicial.
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { ProductImage } from './ProductImage';
import { colors, radius } from '../utils/theme';

interface UserAvatarProps {
  name?: string;
  imageUri?: string | null;
  size?: number;
  style?: ViewStyle;
}

export function UserAvatar({
  name = 'R',
  imageUri,
  size = 38,
  style,
}: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const hasImage = Boolean(imageUri?.trim());

  if (hasImage) {
    return (
      <View
        style={[
          styles.wrap,
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
      >
        <ProductImage
          uri={imageUri}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

/** URI preferida: logo del restaurante, luego foto de usuario */
export function getProfileAvatarUri(
  restaurantLogo?: string,
  userPhoto?: string
): string | null {
  const logo = restaurantLogo?.trim();
  if (logo) return logo;
  const photo = userPhoto?.trim();
  if (photo) return photo;
  return null;
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primarySoft,
    backgroundColor: colors.surfaceMuted,
  },
  fallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  initial: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
});
