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
import { useAuth } from '../../hooks/useAuth';
import { getProducts } from '../../services/productService';
import { InputField } from '../../components/InputField';
import { Button } from '../../components/Button';
import { ProductImage } from '../../components/ProductImage';
import { ModalFormShell } from '../../components/layout/ModalFormShell';
import type { OfferFormData, OfferType } from '../../types/offer';
import type { Product } from '../../types/product';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { notifyError } from '../../utils/notify';

const emptyForm: OfferFormData = {
  type: 'banner',
  badge: '',
  title: '',
  description: '',
  image: '',
  couponCode: '',
  productId: '',
  discountKind: '',
  discountPercent: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
};

const TYPE_OPTIONS: { key: OfferType; label: string; hint: string }[] = [
  { key: 'banner', label: 'Banner', hint: 'Al tocarla abre el restaurante.' },
  { key: 'coupon', label: 'Cupón', hint: 'Sugiere aplicar un cupón existente.' },
  { key: 'dish', label: 'Platillo', hint: 'Al tocarla abre un platillo del menú.' },
];

export function OfferFormScreen({
  navigation,
  route,
}: RootScreenProps<'OfferForm'>) {
  const offerId = route.params?.offerId;
  const isEditing = Boolean(offerId);
  const { addOffer, editOffer, getOfferForm, coupons } = usePromotions();
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;

  const [form, setForm] = useState<OfferFormData>(emptyForm);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (offerId) {
      const existing = getOfferForm(offerId);
      if (existing) {
        setForm(existing);
        setPreviewUri(existing.image || null);
      }
    }
  }, [offerId, getOfferForm]);

  // Platillos del restaurante para el selector de oferta tipo 'dish'.
  useEffect(() => {
    if (!restaurantId) return;
    let active = true;
    getProducts(restaurantId)
      .then((list) => active && setProducts(list))
      .catch(() => active && setProducts([]));
    return () => {
      active = false;
    };
  }, [restaurantId]);

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
      updateField('image', '');
      updateField('localImageUri', uri);
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'El título es obligatorio';
    if (!form.description.trim()) {
      next.description = 'La descripción es obligatoria';
    }
    if (!previewUri && !form.image.trim()) {
      next.image = 'Sube una imagen para la oferta';
    }
    if (form.type === 'dish' && !form.productId) {
      next.productId = 'Elige el platillo que abrirá esta oferta';
    }
    if (form.type === 'coupon' && !form.couponCode.trim()) {
      next.couponCode = 'Elige o escribe el cupón a vincular';
    }
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) {
      next.endsAt = 'La fecha de fin no puede ser anterior al inicio';
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
        err instanceof Error ? err.message : 'No se pudo guardar la oferta'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const couponOptions = coupons.map((c) => c.code);

  const typeHint = TYPE_OPTIONS.find((o) => o.key === form.type)?.hint ?? '';

  return (
    <ModalFormShell
      title={isEditing ? 'Editar oferta' : 'Nueva oferta'}
      subtitle="Promoción visible en el Home de la app móvil."
      onClose={() => navigation.goBack()}
    >
      <Text style={styles.sectionLabel}>TIPO DE OFERTA</Text>
      <View style={styles.typeRow}>
        {TYPE_OPTIONS.map((opt) => {
          const active = form.type === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.typeChip, active && styles.typeChipActive]}
              onPress={() => updateField('type', opt.key)}
            >
              <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>{typeHint}</Text>

      <Text style={styles.sectionLabel}>IMAGEN DE LA OFERTA</Text>

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

      {form.type === 'coupon' && (
        <>
          <InputField
            label="Cupón vinculado"
            value={form.couponCode}
            onChangeText={(v) => updateField('couponCode', v.toUpperCase())}
            placeholder="Código de cupón existente"
            autoCapitalize="characters"
            error={errors.couponCode}
          />
          {couponOptions.length > 0 ? (
            <View style={styles.couponChips}>
              {couponOptions.map((code) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.chip, form.couponCode === code && styles.chipActive]}
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
              Crea un cupón primero si quieres vincularlo a esta oferta.
            </Text>
          )}
        </>
      )}

      {form.type === 'dish' && (
        <>
          <Text style={styles.sectionLabel}>PLATILLO VINCULADO</Text>
          {products.length > 0 ? (
            <View style={styles.couponChips}>
              {products.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, form.productId === p.id && styles.chipActive]}
                  onPress={() => updateField('productId', p.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      form.productId === p.id && styles.chipTextActive,
                    ]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.hint}>
              Este restaurante aún no tiene platillos en el menú.
            </Text>
          )}
          {errors.productId ? (
            <Text style={styles.error}>{errors.productId}</Text>
          ) : null}

          <Text style={styles.sectionLabel}>DESCUENTO</Text>
          <View style={styles.typeRow}>
            {([
              { key: '', label: 'Sin descuento' },
              { key: 'percent', label: 'Porcentaje' },
              { key: '2x1', label: '2x1' },
            ] as { key: OfferFormData['discountKind']; label: string }[]).map((opt) => {
              const active = form.discountKind === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key || 'none'}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                  onPress={() => updateField('discountKind', opt.key)}
                >
                  <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {form.discountKind === 'percent' ? (
            <InputField
              label="Porcentaje de descuento (0-100)"
              value={form.discountPercent}
              onChangeText={(v) => updateField('discountPercent', v)}
              placeholder="15  (100 = gratis)"
              keyboardType="decimal-pad"
            />
          ) : null}
          <Text style={styles.hint}>
            El descuento se aplica al platillo al agregarlo al carrito.
          </Text>
        </>
      )}

      <Text style={styles.sectionLabel}>VIGENCIA (OPCIONAL)</Text>
      <InputField
        label="Inicio (YYYY-MM-DD)"
        value={form.startsAt}
        onChangeText={(v) => updateField('startsAt', v)}
        placeholder="2026-08-20"
      />
      <InputField
        label="Fin (YYYY-MM-DD)"
        value={form.endsAt}
        onChangeText={(v) => updateField('endsAt', v)}
        placeholder="2026-08-31"
        error={errors.endsAt}
      />

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.switchTitle}>Oferta visible</Text>
          <Text style={styles.switchSubtitle}>
            Solo las ofertas activas (y dentro de su vigencia) se muestran.
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
  typeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  typeChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  typeChipTextActive: { color: colors.textOnPrimary },
  imagePicker: {
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    backgroundColor: colors.primarySoft,
  },
  bannerImage: { width: '100%', height: '100%' },
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
