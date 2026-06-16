import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthInput } from '@/components/auth/auth-input';
import { AuthTabSwitcher, type AuthMode } from '@/components/auth/auth-tab-switcher';
import { ForgotPasswordModal } from '@/components/auth/forgot-password-modal';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';
import { QuickBiteLogo } from '@/components/quickbite-logo';
import { QuickBiteColors, QuickBiteCopy } from '@/constants/quickbite';
import { useAuth } from '@/contexts/auth-context';

const BACKGROUND_IMAGE =
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, resetPassword, isConfigured } = useAuth();

  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  const resetForm = (nextMode: AuthMode) => {
    setMode(nextMode);
    setFormError(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const openForgotPassword = () => {
    if (!isConfigured) {
      Alert.alert(
        'Configuración requerida',
        'Configura Firebase en tu archivo .env antes de restablecer la contraseña.',
      );
      return;
    }

    setResetPasswordError(null);
    setForgotPasswordVisible(true);
  };

  const closeForgotPassword = () => {
    if (isResettingPassword) {
      return;
    }

    setForgotPasswordVisible(false);
    setResetPasswordError(null);
  };

  const handleResetPassword = async (resetEmail: string) => {
    setIsResettingPassword(true);
    setResetPasswordError(null);

    try {
      await resetPassword(resetEmail);
      setForgotPasswordVisible(false);
      Alert.alert(
        'Correo enviado',
        'Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.',
      );
    } catch (error) {
      setResetPasswordError(error instanceof Error ? error.message : 'No se pudo enviar el correo.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const validateForm = () => {
    if (mode === 'sign-up' && !fullName.trim()) {
      return 'Ingresa tu nombre completo.';
    }

    if (!email.trim()) {
      return 'Ingresa tu correo electrónico.';
    }

    if (!password) {
      return 'Ingresa tu contraseña.';
    }

    if (mode === 'sign-up' && password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (mode === 'sign-up' && password !== confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
      } else {
        await signUp(fullName, email, password);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Ocurrió un error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.background}>
      <Image
        source={{ uri: BACKGROUND_IMAGE }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={Platform.OS === 'web' ? 0 : 8}
      />
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <QuickBiteLogo size={56} />
            <Text style={styles.tagline}>{QuickBiteCopy.tagline}</Text>
          </View>

          <View style={styles.card}>
            <AuthTabSwitcher mode={mode} onChange={resetForm} />

            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {mode === 'sign-in' ? 'Welcome back' : 'Create an account'}
              </Text>
              <Text style={styles.formSubtitle}>
                {mode === 'sign-in'
                  ? 'Enter your credentials to continue ordering.'
                  : 'Fill in your details to start ordering premium food.'}
              </Text>
            </View>

            {!isConfigured ? (
              <View style={styles.configWarning}>
                <Text style={styles.configWarningText}>
                  Configura las variables EXPO_PUBLIC_FIREBASE_* en un archivo .env para habilitar la
                  autenticación.
                </Text>
              </View>
            ) : null}

            {mode === 'sign-up' ? (
              <AuthInput
                label="Full Name"
                icon="person-outline"
                autoCapitalize="words"
                autoComplete="name"
                placeholder="John Doe"
                value={fullName}
                onChangeText={setFullName}
              />
            ) : null}

            <AuthInput
              label="Email Address"
              icon="mail-outline"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.passwordBlock}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.passwordLabel}>Password</Text>
                {mode === 'sign-in' ? (
                  <Pressable accessibilityRole="button" hitSlop={8} onPress={openForgotPassword}>
                    <Text style={styles.forgotLink}>Forgot?</Text>
                  </Pressable>
                ) : null}
              </View>
              <AuthInput
                label=""
                icon="lock-closed-outline"
                secureTextEntry
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {mode === 'sign-up' ? (
              <AuthInput
                label="Confirm Password"
                icon="lock-closed-outline"
                secureTextEntry
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            ) : null}

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={[styles.primaryButton, isSubmitting ? styles.primaryButtonDisabled : null]}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {mode === 'sign-in' ? 'Continue' : 'Sign Up'}
                </Text>
              )}
            </Pressable>

            <GoogleAuthButton disabled={isSubmitting || !isConfigured} />

            <Text style={styles.legalText}>
              By continuing, you agree to our{' '}
              <Text style={styles.legalLink}>Terms</Text> and{' '}
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordModal
        visible={forgotPasswordVisible}
        initialEmail={email}
        isSubmitting={isResettingPassword}
        error={resetPasswordError}
        onClose={closeForgotPassword}
        onSubmit={handleResetPassword}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  tagline: {
    fontSize: 14,
    color: QuickBiteColors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: QuickBiteColors.white,
    borderRadius: 28,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  formHeader: {
    gap: 6,
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: QuickBiteColors.text,
  },
  formSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: QuickBiteColors.textSecondary,
  },
  configWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
  },
  configWarningText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#92400E',
  },
  passwordBlock: {
    gap: 8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: QuickBiteColors.text,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '600',
    color: QuickBiteColors.primary,
  },
  formError: {
    fontSize: 13,
    color: QuickBiteColors.error,
    marginTop: -4,
  },
  primaryButton: {
    backgroundColor: QuickBiteColors.primary,
    borderRadius: 999,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: QuickBiteColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  legalText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: QuickBiteColors.textSecondary,
  },
  legalLink: {
    color: QuickBiteColors.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
