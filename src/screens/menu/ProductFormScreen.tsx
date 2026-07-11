/**
 * screens/menu/ProductFormScreen.tsx
 * Crear / editar producto (restaurants/{restId}/products/{prodId}).
 * Imagen vía Expo Image Picker → Firebase Storage.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { RootScreenProps } from '../../types/navigation';
import { useProducts } from '../../hooks/useProducts';
import { InputField } from '../../components/InputField';
import { Button } from '../../components/Button';
import { ProductImage } from '../../components/ProductImage';
import { ModalFormShell } from '../../components/layout/ModalFormShell';
import { isValidPrice } from '../../utils/validation';
import { PLACEHOLDER_IMAGE, normalizeImageUrl } from '../../utils/imageUrl';
import type { ProductFormData } from '../../types/product';
import { colors, radius, spacing, typography } from '../../utils/theme';

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  imageURL: '',
  isAvailable: true,
  tags: [],
  toppings: [],
  order: 0,
};

export function ProductFormScreen({
  navigation,
  route,
}: RootScreenProps<'ProductForm'>) {
  const productId = route.params?.productId;
  const isEditing = Boolean(productId);
  const {
    getProduct,
    addProduct,
    editProduct,
    categories,
    addCategory,
  } = useProducts();

  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [tagsText, setTagsText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (productId) {
      const product = getProduct(productId);
      if (product) {
        setForm({
          name: product.name,
          description: product.description,
          price: String(product.price),
          categoryId: product.categoryId,
          imageURL: product.imageURL,
          isAvailable: product.isAvailable,
          tags: product.tags,
          toppings: product.toppings,
          order: product.order,
        });
        setTagsText(product.tags.join(', '));
        setPreviewUri(product.imageURL || null);
        setImageMode(product.imageURL ? 'url' : 'upload');
      }
    } else if (categories[0] && !form.categoryId) {
      setForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [productId, getProduct, categories, form.categoryId]);

  const updateField = <K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a la galería para la imagen del platillo.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPreviewUri(uri);
      setImageMode('upload');
      updateField('imageURL', '');
      updateField('localImageUri', uri);
    }
  };

  const handleImageUrlChange = (value: string) => {
    const trimmed = value.trim();
    updateField('imageURL', trimmed);
    updateField('localImageUri', undefined);
    setPreviewUri(trimmed || null);
    if (trimmed) setImageMode('url');
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const cat = await addCategory(newCategory.trim());
      updateField('categoryId', cat.id);
      setNewCategory('');
    } catch {
      Alert.alert('Error', 'No se pudo crear la categoría');
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'El nombre es obligatorio';
    if (!isValidPrice(form.price)) next.price = 'Precio inválido';
    if (!form.categoryId) next.categoryId = 'Selecciona o crea una categoría';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setStatusMessage('');
    try {
      const payload: ProductFormData = {
        ...form,
        tags: tagsText
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (payload.localImageUri) {
        setStatusMessage('Subiendo imagen a Firebase Storage...');
      }

      if (isEditing && productId) {
        await editProduct(productId, payload);
      } else {
        await addProduct(payload);
      }
      navigation.goBack();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo guardar el producto';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
      setStatusMessage('');
    }
  };

  return (
    <ModalFormShell
      title={isEditing ? 'Editar producto' : 'Nuevo producto'}
      subtitle="Completa los datos del platillo para tu menú."
      onClose={() => navigation.goBack()}
    >
          <Text style={styles.sectionLabel}>IMAGEN DEL PLATILLO</Text>

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
              <ProductImage uri={previewUri} style={styles.image} />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageOverlayText}>
                  {previewUri
                    ? 'Cambiar imagen'
                    : 'Toca para subir imagen (JPG/PNG)'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <>
              <InputField
                label="URL de la imagen"
                placeholder="https://ejemplo.com/platillo.jpg"
                value={form.imageURL}
                onChangeText={handleImageUrlChange}
                autoCapitalize="none"
                keyboardType="url"
              />
              {previewUri ? (
                <ProductImage uri={previewUri} style={styles.urlPreview} />
              ) : null}
            </>
          )}

          <View style={styles.availableRow}>
            <Text style={styles.availableLabel}>Disponible para pedidos</Text>
            <Switch
              value={form.isAvailable}
              onValueChange={(v) => updateField('isAvailable', v)}
              trackColor={{ false: colors.border, true: colors.primarySoft }}
              thumbColor={form.isAvailable ? colors.primary : colors.textMuted}
            />
          </View>

          <InputField
            label="Título del platillo"
            placeholder="Ej. Hamburguesa trufa wagyu"
            value={form.name}
            onChangeText={(v) => updateField('name', v)}
            error={errors.name}
          />

          <Text style={styles.sectionLabel}>CATEGORÍA</Text>
          <View style={styles.categories}>
            {categories.map((cat) => {
              const selected = form.categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => updateField('categoryId', cat.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.categoryId ? (
            <Text style={styles.error}>{errors.categoryId}</Text>
          ) : null}

          <View style={styles.newCatRow}>
            <View style={styles.newCatInput}>
              <InputField
                label="Nueva categoría"
                placeholder="Ej. Entradas"
                value={newCategory}
                onChangeText={setNewCategory}
              />
            </View>
            <Button
              title="Añadir"
              variant="outline"
              onPress={handleAddCategory}
              style={styles.addCatBtn}
            />
          </View>

          <InputField
            label="Precio base ($)"
            placeholder="18.99"
            value={form.price}
            onChangeText={(v) => updateField('price', v)}
            keyboardType="decimal-pad"
            error={errors.price}
          />

          <InputField
            label="Descripción"
            placeholder="Descripción del platillo"
            value={form.description}
            onChangeText={(v) => updateField('description', v)}
            multiline
            numberOfLines={3}
            style={styles.multiline}
          />

          <InputField
            label="Etiquetas (separadas por coma)"
            placeholder="picante, vegetariano"
            value={tagsText}
            onChangeText={setTagsText}
          />

          <Button
            title={
              submitting && statusMessage
                ? statusMessage
                : isEditing
                  ? 'Guardar cambios'
                  : 'Crear producto'
            }
            onPress={handleSubmit}
            loading={submitting}
          />
          <Button
            title="Cancelar y descartar"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.cancel}
          />
    </ModalFormShell>
  );
}

const styles = StyleSheet.create({
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
  modeChipText: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  modeChipTextActive: { color: colors.textOnPrimary },
  imagePicker: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    height: 200,
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '100%', height: '100%' },
  urlPreview: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceMuted,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlayText: {
    ...typography.body,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  availableLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { ...typography.bodySmall, color: colors.text },
  chipTextSelected: { color: colors.textOnPrimary, fontWeight: '600' },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  newCatRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  newCatInput: { flex: 1 },
  addCatBtn: { marginBottom: spacing.md, minWidth: 90 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  cancel: { marginTop: spacing.sm },
});
