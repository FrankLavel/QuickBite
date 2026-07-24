/**
 * screens/auth/LoginScreen.tsx
 * Login en español + inicio de sesión con Google.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import type { AuthScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { InputField } from '../../components/InputField';
import { Button } from '../../components/Button';
import { isValidEmail, isValidPassword } from '../../utils/validation';
import { isFirebaseConfigured } from '../../services/firebase';
import { sendRestaurantPasswordReset } from '../../services/authService';
import { googleWebClientId } from '../../../firebase.config';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { notifySuccess, notifyError } from '../../utils/notify';

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { login, loginWithGoogle, loginWithGoogleIdToken, error, clearError } =
    useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: googleWebClientId || undefined,
    iosClientId: googleWebClientId || undefined,
    androidClientId: googleWebClientId || undefined,
  });

  useEffect(() => {
    if (!googleResponse) return;

    if (googleResponse.type === 'dismiss' || googleResponse.type === 'cancel') {
      setGoogleLoading(false);
      return;
    }

    if (googleResponse.type !== 'success') return;

    const idToken = googleResponse.authentication?.idToken;
    if (!idToken) return;

    setGoogleLoading(true);
    clearError();
    loginWithGoogleIdToken(idToken)
      .catch(() => {
        // error en contexto
      })
      .finally(() => setGoogleLoading(false));
  }, [googleResponse, loginWithGoogleIdToken, clearError]);

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

  const handleGoogleLogin = async () => {
    clearError();

    if (Platform.OS === 'web') {
      setGoogleLoading(true);
      try {
        await loginWithGoogle();
      } catch {
        // error en contexto
      } finally {
        setGoogleLoading(false);
      }
      return;
    }

    if (!googleWebClientId) {
      clearError();
      // Mostrar error manualmente vía throw en hook - use setState local
      return;
    }

    setGoogleLoading(true);
    try {
      await promptGoogleAsync();
    } catch {
      setGoogleLoading(false);
    }
  };

  const showGoogleClientIdHint =
    Platform.OS !== 'web' && !googleWebClientId && isFirebaseConfigured;

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
              <View style={styles.logoRow}>
                <Text style={styles.logoIcon}>🍴</Text>
                <Text style={styles.logoText}>QuickBite</Text>
              </View>
              <Text style={styles.brandTitle}>
                Administra tu restaurante de forma eficiente
              </Text>
              <Text style={styles.brandSubtitle}>
                El portal todo-en-uno para pedidos, menú y crecimiento en tiempo
                real.
              </Text>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>+24% Ingresos</Text>
                <Text style={styles.metricHint}>vs. el mes pasado</Text>
              </View>
            </View>

            <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
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

              <View style={styles.rememberRow}>
                <Switch
                  value={remember}
                  onValueChange={setRemember}
                  trackColor={{ false: colors.border, true: colors.primarySoft }}
                  thumbColor={remember ? colors.primary : colors.textMuted}
                />
                <Text style={styles.rememberText}>
                  Recordar este dispositivo por 30 días
                </Text>
              </View>

              {!isFirebaseConfigured ? (
                <Text style={styles.configBanner}>
                  Abre firebase.config.ts en la raíz del proyecto y pega tu
                  apiKey, messagingSenderId y appId completos desde Firebase
                  Console.
                </Text>
              ) : null}

              {showGoogleClientIdHint ? (
                <Text style={styles.configBanner}>
                  Para Google en móvil, agrega googleWebClientId en
                  firebase.config.ts (Firebase → Auth → Google → Web client ID).
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

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                disabled={googleLoading || submitting}
                activeOpacity={0.85}
              >
                {googleLoading ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.googleText}>
                      Continuar con Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  clearError();
                  navigation.navigate('Register');
                }}
                style={styles.applyRow}
              >
                <Text style={styles.applyText}>
                  ¿No tienes cuenta de restaurante?{' '}
                  <Text style={styles.applyLink}>Regístrate ahora</Text>
                </Text>
              </TouchableOpacity>

              <Text style={styles.encrypted}>CIFRADO AES DE 256 BITS</Text>
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
  cardWide: { flexDirection: 'row', minHeight: 520 },
  brandPanel: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    gap: spacing.md,
  },
  brandPanelWide: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoIcon: { fontSize: 22 },
  logoText: { ...typography.h3, color: colors.primaryLight },
  brandTitle: {
    ...typography.h1,
    color: colors.textOnPrimary,
    marginTop: spacing.md,
  },
  brandSubtitle: {
    ...typography.bodySmall,
    color: colors.textSoft,
    lineHeight: 20,
  },
  metricCard: {
    marginTop: spacing.lg,
    backgroundColor: 'rgba(36, 226, 117, 0.15)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(36, 226, 117, 0.35)',
  },
  metricValue: { ...typography.h3, color: colors.primaryLight },
  metricHint: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
  formPanel: { padding: spacing.lg },
  formPanelWide: { flex: 1.1, padding: spacing.xl, justifyContent: 'center' },
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
    marginBottom: spacing.md,
  },
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  applyRow: { alignItems: 'center', marginTop: spacing.lg },
  applyText: { ...typography.bodySmall, color: colors.textSecondary },
  applyLink: { color: colors.primary, fontWeight: '700' },
  encrypted: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 1,
  },
});
