/**
 * screens/promotions/CouponFormScreen.tsx
 * Crear / editar cupón coupons/{code} con límites del PDF.
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
import type { RootScreenProps } from '../../types/navigation';
import { usePromotions } from '../../hooks/usePromotions';
import { InputField } from '../../components/InputField';
import { Button } from '../../components/Button';
import { DatePickerField } from '../../components/DatePickerField';
import { ModalFormShell } from '../../components/layout/ModalFormShell';
import type { CouponFormData, CouponType } from '../../types/coupon';
import { normalizeCouponCode } from '../../services/couponService';
import { colors, radius, spacing, typography } from '../../utils/theme';

const emptyForm: CouponFormData = {
  code: '',
  type: 'percent',
  value: '',
  minOrder: '0',
  maxUses: '100',
  expiresAt: '',
  isActive: true,
};

export function CouponFormScreen({
  navigation,
  route,
}: RootScreenProps<'CouponForm'>) {
  const codeParam = route.params?.code;
  const isEditing = Boolean(codeParam);
  const { addCoupon, editCoupon, getCouponForm } = usePromotions();

  const [form, setForm] = useState<CouponFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (codeParam) {
      const existing = getCouponForm(codeParam);
      if (existing) setForm(existing);
    }
  }, [codeParam, getCouponForm]);

  const updateField = <K extends keyof CouponFormData>(
    key: K,
    value: CouponFormData[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const setType = (type: CouponType) => updateField('type', type);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const code = normalizeCouponCode(form.code);
    if (!isEditing && !code) next.code = 'El código es obligatorio';
    if (!form.value.trim()) next.value = 'Indica el valor del descuento';
    const valueNum = parseFloat(form.value);
    if (form.type === 'percent' && (valueNum <= 0 || valueNum > 100)) {
      next.value = 'El porcentaje debe estar entre 1 y 100';
    }
    if (form.type === 'fixed' && valueNum <= 0) {
      next.value = 'El monto fijo debe ser mayor a 0';
    }
    const maxUses = parseInt(form.maxUses, 10);
    if (!maxUses || maxUses < 1) {
      next.maxUses = 'Usos máximos debe ser al menos 1';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isEditing && codeParam) {
        await editCoupon(codeParam, form);
      } else {
        await addCoupon(form);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'No se pudo guardar el cupón'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFormShell
      title={isEditing ? 'Editar cupón' : 'Nuevo cupón'}
      subtitle="Los clientes aplican este código al pagar. Define tipo, vigencia y límites."
      onClose={() => navigation.goBack()}
    >
      <InputField
        label="Código del cupón"
        value={form.code}
        onChangeText={(v) => updateField('code', v.toUpperCase())}
        placeholder="EJ: VERANO20"
        autoCapitalize="characters"
        editable={!isEditing}
        error={errors.code}
      />

      <Text style={styles.sectionLabel}>TIPO DE DESCUENTO</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[
            styles.typeBtn,
            form.type === 'percent' && styles.typeBtnActive,
          ]}
          onPress={() => setType('percent')}
        >
          <Text
            style={[
              styles.typeBtnText,
              form.type === 'percent' && styles.typeBtnTextActive,
            ]}
          >
            Porcentaje (%)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeBtn,
            form.type === 'fixed' && styles.typeBtnActive,
          ]}
          onPress={() => setType('fixed')}
        >
          <Text
            style={[
              styles.typeBtnText,
              form.type === 'fixed' && styles.typeBtnTextActive,
            ]}
          >
            Monto fijo ($)
          </Text>
        </TouchableOpacity>
      </View>

      <InputField
        label={form.type === 'percent' ? 'Porcentaje' : 'Monto en pesos'}
        value={form.value}
        onChangeText={(v) => updateField('value', v)}
        keyboardType="decimal-pad"
        placeholder={form.type === 'percent' ? '10' : '50.00'}
        error={errors.value}
      />

      <InputField
        label="Pedido mínimo ($)"
        value={form.minOrder}
        onChangeText={(v) => updateField('minOrder', v)}
        keyboardType="decimal-pad"
        placeholder="0"
      />

      <InputField
        label="Usos máximos"
        value={form.maxUses}
        onChangeText={(v) => updateField('maxUses', v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        placeholder="100"
        error={errors.maxUses}
      />

      <DatePickerField
        label="Fecha de vencimiento"
        value={form.expiresAt}
        onChange={(iso) => updateField('expiresAt', iso)}
        hint="Opcional. Sin fecha = cupón sin vencimiento."
      />

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.switchTitle}>Cupón activo</Text>
          <Text style={styles.switchSubtitle}>
            Solo los cupones activos aparecen para los clientes.
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
        title={isEditing ? 'Guardar cambios' : 'Crear cupón'}
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
    marginTop: spacing.sm,
  },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  typeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  typeBtnText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  typeBtnTextActive: { color: colors.primary },
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
