/**
 * CoverPicker.tsx
 * Selector de imagen de portada (banner 16:9): subir imagen o pegar URL.
 * Se guarda en restaurants/{id}.coverImage y se muestra en la app cliente.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { InputField } from './InputField';
import { colors, radius, spacing, typography } from '../utils/theme';
import { notifyError } from '../utils/notify';

export interface CoverPickerValue {
  previewUri: string | null;
  imageURL: string;
  localUri?: string;
}

interface CoverPickerProps {
  value: CoverPickerValue;
  onChange: (value: CoverPickerValue) => void;
}

export function CoverPicker({ value, onChange }: CoverPickerProps) {
  const [mode, setMode] = useState<'upload' | 'url'>(
    value.imageURL && !value.localUri ? 'url' : 'upload'
  );

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notifyError(
        'Necesitamos acceso a la galería para la portada.',
        'Permiso requerido'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      onChange({ previewUri: uri, imageURL: '', localUri: uri });
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
      <Text style={styles.label}>PORTADA / BANNER</Text>

      <TouchableOpacity
        style={styles.preview}
        onPress={pickImage}
        activeOpacity={0.85}
      >
        {value.previewUri ? (
          <Image
            source={{ uri: value.previewUri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Feather name="image" size={28} color={colors.primary} />
            <Text style={styles.placeholderText}>
              Toca para elegir una portada (16:9)
            </Text>
          </View>
        )}
        <View style={styles.cameraBadge}>
          <Feather name="camera" size={14} color={colors.textOnPrimary} />
        </View>
      </TouchableOpacity>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeChip, mode === 'upload' && styles.modeActive]}
          onPress={() => setMode('upload')}
        >
          <Text
            style={[styles.modeText, mode === 'upload' && styles.modeTextActive]}
          >
            Subir
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeChip, mode === 'url' && styles.modeActive]}
          onPress={() => setMode('url')}
        >
          <Text
            style={[styles.modeText, mode === 'url' && styles.modeTextActive]}
          >
            URL
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'upload' ? (
        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Feather name="upload" size={16} color={colors.primary} />
          <Text style={styles.uploadText}>Elegir imagen (JPG/PNG)</Text>
        </TouchableOpacity>
      ) : (
        <InputField
          label="URL de la portada"
          placeholder="https://ejemplo.com/portada.jpg"
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
  wrap: { marginBottom: spacing.md },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  preview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  previewImage: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  placeholderText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cameraBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  modeRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  modeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  modeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
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
