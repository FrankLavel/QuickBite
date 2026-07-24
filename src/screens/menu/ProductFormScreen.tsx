/**
 * screens/menu/ProductFormScreen.tsx
 * Crear / editar producto (restaurants/{restId}/products/{prodId}).
 * Layout de 2 columnas (mockup): Detalles + Variaciones | Imagen + Vista previa + Etiquetas.
 * Imagen vía Expo Image Picker → Firebase Storage.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import type { RootScreenProps } from '../../types/navigation';
import { useProducts } from '../../hooks/useProducts';
import { InputField } from '../../components/InputField';
import { Button } from '../../components/Button';
import { ProductImage } from '../../components/ProductImage';
import { ModalFormShell } from '../../components/layout/ModalFormShell';
import { SectionCard } from '../../components/SectionCard';
import { isValidPrice } from '../../utils/validation';
import type { ProductFormData } from '../../types/product';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { notifyError } from '../../utils/notify';

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
  const { getProduct, addProduct, editProduct, categories, addCategory } =
    useProducts();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newCategory, setNewCategory] = useState('');
  const [newToppingName, setNewToppingName] = useState('');
  const [newToppingPrice, setNewToppingPrice] = useState('');
  const [tagInput, setTagInput] = useState('');

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
      notifyError(
        'Necesitamos acceso a la galería para la imagen del platillo.',
        'Permiso requerido'
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
      notifyError('No se pudo crear la categoría');
    }
  };

  const handleAddTopping = () => {
    const name = newToppingName.trim();
    if (!name) return;
    const parsed = parseFloat(newToppingPrice);
    const price = Number.isNaN(parsed) ? 0 : parsed;
    updateField('toppings', [
      ...form.toppings,
      { name, price, required: false, options: [] },
    ]);
    setNewToppingName('');
    setNewToppingPrice('');
  };

  const handleRemoveTopping = (index: number) => {
    updateField(
      'toppings',
      form.toppings.filter((_, i) => i !== index)
    );
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag)) {
      setTagInput('');
      return;
    }
    updateField('tags', [...form.tags, tag]);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    updateField(
      'tags',
      form.tags.filter((t) => t !== tag)
    );
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
      if (form.localImageUri) {
        setStatusMessage('Subiendo imagen...');
      }
      if (isEditing && productId) {
        await editProduct(productId, form);
      } else {
        await addProduct(form);
      }
      navigation.goBack();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo guardar el producto';
      notifyError(message);
    } finally {
      setSubmitting(false);
      setStatusMessage('');
    }
  };

  const priceNum = parseFloat(form.price) || 0;

  return (
    <ModalFormShell
      title={isEditing ? 'Editar platillo' : 'Nuevo platillo'}
      subtitle="Completa los datos del platillo para tu menú."
      onClose={() => navigation.goBack()}
      maxWidth={1040}
    >
      <View style={[styles.columns, wide && styles.columnsRow]}>
        {/* ---------- IZQUIERDA ---------- */}
        <View style={wide ? styles.colLeft : styles.colFull}>
          <SectionCard
            title="Detalles del platillo"
            style={styles.cardGap}
            action={
              <View style={styles.availToggle}>
                <Text style={styles.availText}>
                  {form.isAvailable ? 'Disponible' : 'No disponible'}
                </Text>
                <Switch
                  value={form.isAvailable}
                  onValueChange={(v) => updateField('isAvailable', v)}
                  trackColor={{ false: colors.border, true: colors.primarySoft }}
                  thumbColor={
                    form.isAvailable ? colors.primary : colors.textMuted
                  }
                />
              </View>
            }
          >
            <InputField
              label="Título del platillo"
              placeholder="Ej. Hamburguesa trufa wagyu"
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              error={errors.name}
            />

            <Text style={styles.fieldLabel}>CATEGORÍA</Text>
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
                style={styles.inlineBtn}
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
              placeholder="Describe ingredientes, sabor y preparación…"
              value={form.description}
              onChangeText={(v) => updateField('description', v)}
              multiline
              numberOfLines={3}
              style={styles.multiline}
            />
          </SectionCard>

          <SectionCard
            title="Variaciones y extras"
            subtitle="Toppings opcionales que el cliente podrá elegir al pedir."
            style={styles.cardGap}
          >
            {form.toppings.length > 0 ? (
              <View style={styles.toppingList}>
                {form.toppings.map((top, index) => (
                  <View key={`${top.name}-${index}`} style={styles.toppingRow}>
                    <Feather name="menu" size={16} color={colors.textMuted} />
                    <Text style={styles.toppingName}>{top.name}</Text>
                    <Text style={styles.toppingPrice}>
                      +${top.price.toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTopping(index)}
                      hitSlop={8}
                    >
                      <Feather name="trash-2" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.mutedNote}>
                Sin extras. Agrega opciones como "Queso extra" o "Doble carne".
              </Text>
            )}
            <View style={styles.toppingAddRow}>
              <View style={styles.toppingNameInput}>
                <InputField
                  label="Extra"
                  placeholder="Ej. Queso extra"
                  value={newToppingName}
                  onChangeText={setNewToppingName}
                />
              </View>
              <View style={styles.toppingPriceInput}>
                <InputField
                  label="Precio ($)"
                  placeholder="0.00"
                  value={newToppingPrice}
                  onChangeText={setNewToppingPrice}
                  keyboardType="decimal-pad"
                />
              </View>
              <Button
                title="Añadir"
                variant="outline"
                onPress={handleAddTopping}
                style={styles.inlineBtn}
              />
            </View>
          </SectionCard>
        </View>

        {/* ---------- DERECHA ---------- */}
        <View style={wide ? styles.colRight : styles.colFull}>
          <SectionCard title="Imagen del platillo" style={styles.cardGap}>
            <View style={styles.imageModeRow}>
              {(
                [
                  ['upload', 'Subir archivo'],
                  ['url', 'Usar URL'],
                ] as const
              ).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.modeChip,
                    imageMode === key && styles.modeChipActive,
                  ]}
                  onPress={() => setImageMode(key)}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      imageMode === key && styles.modeChipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {imageMode === 'upload' ? (
              <TouchableOpacity
                style={styles.dropzone}
                onPress={pickImage}
                activeOpacity={0.85}
              >
                {previewUri ? (
                  <ProductImage uri={previewUri} style={styles.dropzoneImg} />
                ) : (
                  <View style={styles.dropzoneEmpty}>
                    <View style={styles.uploadIcon}>
                      <Feather name="upload-cloud" size={22} color={colors.primary} />
                    </View>
                    <Text style={styles.dropzoneText}>
                      Toca para subir imagen
                    </Text>
                    <Text style={styles.dropzoneHint}>JPG o PNG (máx. 5MB)</Text>
                  </View>
                )}
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
          </SectionCard>

          {/* Vista previa en vivo */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeadRow}>
              <Feather name="eye" size={16} color={colors.textOnPrimary} />
              <Text style={styles.previewHead}>Vista previa</Text>
            </View>
            <Text style={styles.previewSub}>
              Así verá el cliente este platillo en la app.
            </Text>

            <View style={styles.previewInner}>
              <ProductImage uri={previewUri} style={styles.previewImg} />
              <View style={styles.previewInfo}>
                <Text style={styles.previewName} numberOfLines={1}>
                  {form.name || 'Nombre del platillo'}
                </Text>
                <Text style={styles.previewPrice}>${priceNum.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.9}
            >
              <Feather name="check" size={16} color={colors.primary} />
              <Text style={styles.saveBtnText}>
                {submitting
                  ? statusMessage || 'Guardando…'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Crear platillo'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.9}
            >
              <Text style={styles.cancelBtnText}>Cancelar y descartar</Text>
            </TouchableOpacity>
          </View>

          <SectionCard
            title="Etiquetas de búsqueda"
            subtitle="Ayudan a que los clientes encuentren el platillo."
            style={styles.cardGap}
          >
            {form.tags.length > 0 ? (
              <View style={styles.tagWrap}>
                {form.tags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTag(tag)}
                      hitSlop={6}
                    >
                      <Feather name="x" size={13} color={colors.primaryDark} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.mutedNote}>
                Sin etiquetas. Ej. "picante", "vegetariano".
              </Text>
            )}
            <View style={styles.tagAddRow}>
              <View style={styles.tagInput}>
                <InputField
                  label="Nueva etiqueta"
                  placeholder="Ej. picante"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                />
              </View>
              <Button
                title="Añadir"
                variant="outline"
                onPress={handleAddTag}
                style={styles.inlineBtn}
              />
            </View>
          </SectionCard>
        </View>
      </View>
    </ModalFormShell>
  );
}

const styles = StyleSheet.create({
  columns: { gap: spacing.md },
  columnsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  colLeft: { flex: 3, gap: spacing.md },
  colRight: { flex: 2, gap: spacing.md },
  colFull: { gap: spacing.md },
  cardGap: {},
  availToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  availText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
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
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.bodySmall, color: colors.text },
  chipTextSelected: { color: colors.textOnPrimary, fontWeight: '600' },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
  newCatRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  newCatInput: { flex: 1 },
  inlineBtn: { marginBottom: spacing.md, minWidth: 90 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  mutedNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  toppingList: { gap: spacing.sm, marginBottom: spacing.sm },
  toppingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toppingName: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  toppingPrice: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  toppingAddRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  toppingNameInput: { flex: 1 },
  toppingPriceInput: { width: 110 },
  imageModeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeChipText: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  modeChipTextActive: { color: colors.textOnPrimary },
  dropzone: {
    height: 200,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneImg: { width: '100%', height: '100%' },
  dropzoneEmpty: { alignItems: 'center', gap: 4 },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  dropzoneText: { ...typography.body, color: colors.text, fontWeight: '600' },
  dropzoneHint: { ...typography.caption, color: colors.textSecondary },
  urlPreview: {
    width: '100%',
    height: 170,
    borderRadius: radius.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceMuted,
  },
  previewCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  previewHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewHead: {
    ...typography.h3,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  previewSub: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    marginBottom: spacing.md,
  },
  previewInner: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  previewImg: { width: '100%', height: 120 },
  previewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: spacing.sm,
  },
  previewName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  previewPrice: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '800',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  saveBtnText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  cancelBtnText: {
    ...typography.bodySmall,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  tagChipText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  tagAddRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  tagInput: { flex: 1 },
});
