/**
 * screens/promotions/OfferFormScreen.tsx
 * Crear / editar banner offers/{offerId} (Home móvil).
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import type { RootScreenProps } from '../../types/navigation';
import { usePromotions } from '../../hooks/usePromotions';
import { InputField } from '../../components/InputField';
import { Button } from '../../components/Button';
import { ProductImage } from '../../components/ProductImage';
import { ModalFormShell } from '../../components/layout/ModalFormShell';
import type { OfferFormData } from '../../types/offer';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { notifyError } from '../../utils/notify';

const emptyForm: OfferFormData = {
  badge: '',
  title: '',
  description: '',
  image: '',
  couponCode: '',
  isActive: true,
};

export function OfferFormScreen({
  navigation,
  route,
}: RootScreenProps<'OfferForm'>) {
  const offerId = route.params?.offerId;
  const isEditing = Boolean(offerId);
  const { addOffer, editOffer, getOfferForm, coupons } = usePromotions();

  const [form, setForm] = useState<OfferFormData>(emptyForm);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (offerId) {
      const existing = getOfferForm(offerId);
      if (existing) {
        setForm(existing);
        setPreviewUri(existing.image || null);
        setImageMode(existing.image ? 'url' : 'upload');
      }
    }
  }, [offerId, getOfferForm]);

  const updateField = <K extends keyof OfferFormData>(
    key: K,
    value: OfferFormData[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notifyError(
        'Necesitamos acceso a la galería para la imagen del banner.',
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
      setPreviewUri(uri);
      setImageMode('upload');
      updateField('image', '');
      updateField('localImageUri', uri);
    }
  };

  const handleImageUrlChange = (value: string) => {
    const trimmed = value.trim();
    updateField('image', trimmed);
    updateField('localImageUri', undefined);
    setPreviewUri(trimmed || null);
    if (trimmed) setImageMode('url');
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'El título es obligatorio';
    if (!form.description.trim()) {
      next.description = 'La descripción es obligatoria';
    }
    if (!previewUri && !form.image.trim()) {
      next.image = 'Sube una imagen o ingresa una URL';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isEditing && offerId) {
        await editOffer(offerId, form);
      } else {
        await addOffer(form);
      }
      navigation.goBack();
    } catch (err) {
      notifyError(
        err instanceof Error ? err.message : 'No se pudo guardar el banner'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const couponOptions = coupons.map((c) => c.code);

  return (
    <ModalFormShell
      title={isEditing ? 'Editar banner' : 'Nuevo banner'}
      subtitle="Banner visible en el Home de la app móvil."
      onClose={() => navigation.goBack()}
    >
      <Text style={styles.sectionLabel}>IMAGEN DEL BANNER</Text>

      <View style={styles.imageModeRow}>
        <TouchableOpacity
          style={[
            styles.modeChip,
            imageMode === 'upload' && styles.modeChipActive,
          ]}
          onPress={() => setImageMode('upload')}
        >
          <Text
            style={[
              styles.modeChipText,
              imageMode === 'upload' && styles.modeChipTextActive,
            ]}
          >
            Subir archivo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeChip,
            imageMode === 'url' && styles.modeChipActive,
          ]}
          onPress={() => setImageMode('url')}
        >
          <Text
            style={[
              styles.modeChipText,
              imageMode === 'url' && styles.modeChipTextActive,
            ]}
          >
            Usar URL
          </Text>
        </TouchableOpacity>
      </View>

      {imageMode === 'upload' ? (
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          <ProductImage
            uri={previewUri ?? form.image}
            style={styles.bannerImage}
          />
          <View style={styles.imageOverlay}>
            <Feather name="camera" size={20} color={colors.textOnPrimary} />
            <Text style={styles.imageOverlayText}>
              {previewUri ? 'Cambiar imagen' : 'Toca para subir imagen'}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <>
          <InputField
            label="URL de la imagen"
            placeholder="https://ejemplo.com/banner.jpg"
            value={form.image}
            onChangeText={handleImageUrlChange}
            autoCapitalize="none"
            keyboardType="url"
          />
          {previewUri ? (
            <ProductImage uri={previewUri} style={styles.urlPreview} />
          ) : null}
        </>
      )}
      {errors.image ? <Text style={styles.error}>{errors.image}</Text> : null}

      <InputField
        label="Etiqueta (badge)"
        value={form.badge}
        onChangeText={(v) => updateField('badge', v)}
        placeholder="NUEVO, -20%, etc."
      />

      <InputField
        label="Título"
        value={form.title}
        onChangeText={(v) => updateField('title', v)}
        placeholder="2x1 en hamburguesas"
        error={errors.title}
      />

      <InputField
        label="Descripción"
        value={form.description}
        onChangeText={(v) => updateField('description', v)}
        placeholder="Válido de lunes a jueves..."
        multiline
        numberOfLines={3}
        error={errors.description}
      />

      <InputField
        label="Cupón vinculado (opcional)"
        value={form.couponCode}
        onChangeText={(v) => updateField('couponCode', v.toUpperCase())}
        placeholder="Código de cupón existente"
        autoCapitalize="characters"
      />
      {couponOptions.length > 0 ? (
        <View style={styles.couponChips}>
          {couponOptions.map((code) => (
            <TouchableOpacity
              key={code}
              style={[
                styles.chip,
                form.couponCode === code && styles.chipActive,
              ]}
              onPress={() => updateField('couponCode', code)}
            >
              <Text
                style={[
                  styles.chipText,
                  form.couponCode === code && styles.chipTextActive,
                ]}
              >
                {code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>
          Crea un cupón primero si quieres vincularlo a este banner.
        </Text>
      )}

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.switchTitle}>Banner visible</Text>
          <Text style={styles.switchSubtitle}>
            Solo los banners activos se muestran en la app.
          </Text>
        </View>
        <Switch
          value={form.isActive}
          onValueChange={(v) => updateField('isActive', v)}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={form.isActive ? colors.primary : colors.textMuted}
        />
      </View>

      <Button
        title={isEditing ? 'Guardar cambios' : 'Publicar banner'}
        onPress={handleSubmit}
        loading={submitting}
        style={styles.submit}
      />
      <Button
        title="Cancelar"
        variant="outline"
        onPress={() => navigation.goBack()}
      />
    </ModalFormShell>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  imageModeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeChipText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  modeChipTextActive: { color: colors.textOnPrimary },
  imagePicker: {
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    backgroundColor: colors.primarySoft,
  },
  bannerImage: { width: '100%', height: '100%' },
  urlPreview: {
    width: '100%',
    height: 160,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceMuted,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(8, 105, 49, 0.85)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  imageOverlayText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  couponChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: { color: colors.primary },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  switchText: { flex: 1, marginRight: spacing.md },
  switchTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  switchSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  submit: { marginBottom: spacing.sm },
});
