/**
 * AvatarPicker.tsx
 * Selector de avatar: la imagen se sube a Storage desde la galería.
 * `imageURL` conserva la URL ya almacenada al editar un perfil existente.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { UserAvatar } from './UserAvatar';
import { colors, radius, spacing, typography } from '../utils/theme';
import { notifyError } from '../utils/notify';

export interface AvatarPickerValue {
  previewUri: string | null;
  imageURL: string;
  localUri?: string;
}

interface AvatarPickerProps {
  label?: string;
  name: string;
  value: AvatarPickerValue;
  onChange: (value: AvatarPickerValue) => void;
}

export function AvatarPicker({
  label = 'Foto del restaurante',
  name,
  value,
  onChange,
}: AvatarPickerProps) {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notifyError(
        'Necesitamos acceso a la galería para la foto.',
        'Permiso requerido'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      onChange({
        previewUri: uri,
        imageURL: '',
        localUri: uri,
      });
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>

      <View style={styles.row}>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
          <UserAvatar
            name={name}
            imageUri={value.previewUri}
            size={88}
          />
          <View style={styles.cameraBadge}>
            <Feather name="camera" size={14} color={colors.textOnPrimary} />
          </View>
        </TouchableOpacity>

        <View style={styles.hints}>
          <Text style={styles.hintTitle}>Avatar del restaurante</Text>
          <Text style={styles.hintText}>
            Se muestra en el encabezado y en la app móvil como logo.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
        <Feather name="upload" size={16} color={colors.primary} />
        <Text style={styles.uploadText}>Elegir imagen (JPG/PNG)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  hints: { flex: 1 },
  hintTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  hintText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.primarySoft,
  },
  uploadText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
});
