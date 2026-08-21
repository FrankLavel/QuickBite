/**
 * screens/auth/LoginScreen.tsx
 * Login del portal: SOLO correo y contraseña. No hay registro ni acceso con
 * Google — el administrador da de alta los usuarios desde Firebase.
 */

import React, { useState } from 'react';
import type { ComponentProps } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { AuthScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { InputField } from '../../components/InputField';
import { Button } from '../../components/Button';
import { isValidEmail, isValidPassword } from '../../utils/validation';
import { isFirebaseConfigured } from '../../services/firebase';
import { sendRestaurantPasswordReset } from '../../services/authService';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { notifySuccess, notifyError } from '../../utils/notify';

// Verde oscuro del hero: tono oscuro de la misma marca verde del dashboard.
const BRAND_DARK = '#0b3a21';

const FEATURES: { icon: ComponentProps<typeof Feather>['name']; label: string }[] = [
  { icon: 'bar-chart-2', label: 'Reportes en\ntiempo real' },
  { icon: 'box', label: 'Pedidos y menús\ncentralizados' },
  { icon: 'users', label: 'Clientes más\nsatisfechos' },
];

export function LoginScreen(_props: AuthScreenProps<'Login'>) {
  const { login, error, clearError } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const validate = () => {
    const next: typeof fieldErrors = {};
    if (!isValidEmail(email)) next.email = 'Ingresa un correo válido';
    if (!isValidPassword(password)) next.password = 'Mínimo 6 caracteres';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleForgotPassword = async () => {
    clearError();
    setResetMessage(null);
    if (!isValidEmail(email)) {
      setFieldErrors((prev) => ({
        ...prev,
        email: 'Escribe tu correo arriba para recuperar la contraseña',
      }));
      return;
    }
    try {
      await sendRestaurantPasswordReset(email);
      const msg =
        'Te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja (y spam).';
      notifySuccess(msg, 'Correo enviado');
      setResetMessage(msg);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo enviar el correo';
      notifyError(message, 'No se pudo enviar');
    }
  };

  const handleLogin = async () => {
    clearError();
    setResetMessage(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(email, password, remember);
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
          contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, isWide && styles.cardWide]}>
            <View style={[styles.brandPanel, isWide && styles.brandPanelWide]}>
              <View style={styles.brandDecor} pointerEvents="none" />

              <View style={styles.brandTop}>
                <View style={styles.logoRow}>
                  <Image
                    source={require('../../../assets/images/logo-quickbite.png')}
                    style={styles.logoImg}
                    resizeMode="contain"
                  />
                  <Text style={styles.logoText}>QuickBite</Text>
                </View>

                <Text style={styles.brandTitle}>
                  Administra tu{' '}
                  <Text style={styles.brandTitleAccent}>restaurante</Text> como un
                  profesional
                </Text>
                <Text style={styles.brandSubtitle}>
                  Gestiona pedidos, menús, inventario y crecimiento en tiempo real
                  desde un solo lugar.
                </Text>

                <View style={styles.metricCard}>
                  <View style={styles.metricChart}>
                    <Feather name="trending-up" size={24} color={colors.primaryLight} />
                  </View>
                  <View style={styles.metricTextCol}>
                    <Text style={styles.metricValue}>+24%</Text>
                    <Text style={styles.metricLabel}>Ingresos este mes</Text>
                    <Text style={styles.metricHint}>vs. el mes pasado</Text>
                  </View>
                  <View style={styles.metricBadge}>
                    <Feather name="arrow-up-right" size={18} color={colors.textOnPrimary} />
                  </View>
                </View>
              </View>

              <View style={styles.featuresRow}>
                {FEATURES.map((f) => (
                  <View key={f.label} style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Feather name={f.icon} size={20} color={colors.primaryLight} />
                    </View>
                    <Text style={styles.featureLabel}>{f.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
              <View style={styles.shieldBadge}>
                <Feather name="shield" size={22} color={colors.primary} />
              </View>
              <Text style={styles.welcome}>Bienvenido de nuevo</Text>
              <Text style={styles.welcomeHint}>
                Accede de forma segura a tu panel de restaurante
              </Text>

              <InputField
                label="Correo electrónico"
                placeholder="gerente@quickbite.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon={<Text>✉️</Text>}
                error={fieldErrors.email}
              />

              <InputField
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<Text>🔒</Text>}
                rightLabel="¿Olvidaste tu contraseña?"
                onRightLabelPress={handleForgotPassword}
                error={fieldErrors.password}
              />

              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRemember(!remember)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                  {remember ? (
                    <Feather name="check" size={13} color={colors.textOnPrimary} />
                  ) : null}
                </View>
                <Text style={styles.rememberText}>
                  Recordar este dispositivo por 30 días
                </Text>
              </TouchableOpacity>

              {!isFirebaseConfigured ? (
                <Text style={styles.configBanner}>
                  Abre firebase.config.ts en la raíz del proyecto y pega tu
                  apiKey, messagingSenderId y appId completos desde Firebase
                  Console.
                </Text>
              ) : null}

              {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
              {resetMessage ? (
                <Text style={styles.successBanner}>{resetMessage}</Text>
              ) : null}

              <Button
                title="Iniciar sesión en el portal →"
                onPress={handleLogin}
                loading={submitting}
              />

              <View style={styles.encryptedRow}>
                <Feather name="shield" size={13} color={colors.textMuted} />
                <Text style={styles.encrypted}>
                  Conexión segura cifrada con AES de 256 bits
                </Text>
              </View>
            </View>
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
  scrollWide: { padding: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  cardWide: { flexDirection: 'row', minHeight: 620, maxWidth: 1040 },
  brandPanel: {
    backgroundColor: BRAND_DARK,
    padding: spacing.lg,
    gap: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  brandPanelWide: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  brandDecor: {
    position: 'absolute',
    right: -80,
    top: -40,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(36, 226, 117, 0.06)',
  },
  brandTop: { gap: spacing.md },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoImg: { width: 34, height: 34, borderRadius: radius.sm },
  logoText: { ...typography.h3, color: colors.textOnPrimary, fontWeight: '800' },
  brandTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '800',
    color: colors.textOnPrimary,
    marginTop: spacing.lg,
  },
  brandTitleAccent: { color: colors.primaryLight },
  brandSubtitle: {
    ...typography.body,
    color: colors.textSoft,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(36, 226, 117, 0.1)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(36, 226, 117, 0.28)',
  },
  metricChart: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(36, 226, 117, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextCol: { flex: 1 },
  metricValue: { fontSize: 24, fontWeight: '800', color: colors.primaryLight },
  metricLabel: {
    ...typography.bodySmall,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  metricHint: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  metricBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  featureItem: { flex: 1, alignItems: 'center', gap: spacing.sm },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    ...typography.caption,
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 15,
  },
  formPanel: { padding: spacing.lg },
  formPanelWide: { flex: 1.1, padding: spacing.xl, justifyContent: 'center' },
  shieldBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  welcome: { ...typography.h1, color: colors.text },
  welcomeHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  rememberText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
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
  successBanner: {
    ...typography.bodySmall,
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  configBanner: {
    ...typography.bodySmall,
    color: colors.warning,
    backgroundColor: colors.warningSoft,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  encryptedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  encrypted: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
