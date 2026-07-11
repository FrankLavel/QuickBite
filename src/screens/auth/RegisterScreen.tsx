/**
 * screens/auth/RegisterScreen.tsx
 * Alta de usuario role=restaurant + documento restaurants.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { InputField } from '../../components/InputField';
import { Button } from '../../components/Button';
import { isValidEmail, isValidPassword } from '../../utils/validation';
import { colors, radius, spacing, typography } from '../../utils/theme';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { register, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'El nombre del responsable es obligatorio';
    if (!restaurantName.trim())
      next.restaurantName = 'El nombre del restaurante es obligatorio';
    if (!isValidEmail(email)) next.email = 'Ingresa un correo válido';
    if (!isValidPassword(password)) next.password = 'Mínimo 6 caracteres';
    if (password !== confirm) next.confirm = 'Las contraseñas no coinciden';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        restaurantName: restaurantName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        address: address.trim(),
      });
    } catch {
      // error en contexto
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.logo}>🍴 QuickBite</Text>
            <Text style={styles.title}>Crear cuenta de restaurante</Text>
            <Text style={styles.subtitle}>
              Registra tu negocio y empieza a gestionar tu menú y pedidos.
            </Text>

            <InputField
              label="Nombre del responsable"
              placeholder="Ana García"
              value={name}
              onChangeText={setName}
              error={fieldErrors.name}
            />
            <InputField
              label="Nombre del restaurante"
              placeholder="Mi Restaurante"
              value={restaurantName}
              onChangeText={setRestaurantName}
              error={fieldErrors.restaurantName}
            />
            <InputField
              label="Correo electrónico"
              placeholder="gerente@quickbite.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              error={fieldErrors.email}
            />
            <InputField
              label="Teléfono"
              placeholder="+52 55 0000 0000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <InputField
              label="Dirección"
              placeholder="Calle, ciudad"
              value={address}
              onChangeText={setAddress}
            />
            <InputField
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={fieldErrors.password}
            />
            <InputField
              label="Confirmar contraseña"
              placeholder="••••••••"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              error={fieldErrors.confirm}
            />

            {error ? (
              <Text style={styles.errorBanner}>{error}</Text>
            ) : null}

            <Button
              title="Crear cuenta"
              onPress={handleRegister}
              loading={submitting}
            />

            <TouchableOpacity
              onPress={() => {
                clearError();
                navigation.navigate('Login');
              }}
              style={styles.loginRow}
            >
              <Text style={styles.loginText}>
                ¿Ya tienes cuenta?{' '}
                <Text style={styles.loginLink}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  logo: { ...typography.h3, color: colors.primary, marginBottom: spacing.sm },
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  errorBanner: {
    ...typography.bodySmall,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  loginRow: { marginTop: spacing.lg, alignItems: 'center' },
  loginText: { ...typography.bodySmall, color: colors.textSecondary },
  loginLink: { color: colors.primary, fontWeight: '700' },
});
