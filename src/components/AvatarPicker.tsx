/**
 * AvatarPicker.tsx
 * Selector de avatar: subir imagen o pegar URL.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { UserAvatar } from './UserAvatar';
import { InputField } from './InputField';
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
  const [mode, setMode] = useState<'upload' | 'url'>(
    value.imageURL && !value.localUri ? 'url' : 'upload'
  );

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
      setMode('upload');
    }
  };

  const handleUrlChange = (url: string) => {
    const trimmed = url.trim();
    onChange({
      previewUri: trimmed || null,
      imageURL: trimmed,
      localUri: undefined,
    });
    if (trimmed) setMode('url');
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
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeChip, mode === 'upload' && styles.modeActive]}
              onPress={() => setMode('upload')}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === 'upload' && styles.modeTextActive,
                ]}
              >
                Subir
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeChip, mode === 'url' && styles.modeActive]}
              onPress={() => setMode('url')}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === 'url' && styles.modeTextActive,
                ]}
              >
                URL
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {mode === 'upload' ? (
        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Feather name="upload" size={16} color={colors.primary} />
          <Text style={styles.uploadText}>Elegir imagen (JPG/PNG)</Text>
        </TouchableOpacity>
      ) : (
        <InputField
          label="URL de la imagen"
          placeholder="https://ejemplo.com/logo.jpg"
          value={value.imageURL}
          onChangeText={handleUrlChange}
          autoCapitalize="none"
          keyboardType="url"
        />
      )}
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
  modeRow: { flexDirection: 'row', gap: spacing.xs },
  modeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  modeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  modeTextActive: { color: colors.textOnPrimary },
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
