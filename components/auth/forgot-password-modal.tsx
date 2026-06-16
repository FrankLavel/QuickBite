import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { QuickBiteColors } from '@/constants/quickbite';

type ForgotPasswordModalProps = {
  visible: boolean;
  initialEmail?: string;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (email: string) => void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function ForgotPasswordModal({
  visible,
  initialEmail = '',
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    if (visible) {
      setEmail(initialEmail);
    }
  }, [visible, initialEmail]);

  const handleSubmit = () => {
    if (!validateEmail(email)) {
      return;
    }

    onSubmit(email.trim());
  };

  const localError =
    email.length > 0 && !validateEmail(email) ? 'Ingresa un correo electrónico válido.' : null;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Restablecer contraseña</Text>
          <Text style={styles.subtitle}>
            Te enviaremos un enlace a tu correo para crear una nueva contraseña.
          </Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
            keyboardType="email-address"
            placeholder="name@example.com"
            placeholderTextColor={QuickBiteColors.textMuted}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          {localError ? <Text style={styles.errorText}>{localError}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting || !validateEmail(email)}
            onPress={handleSubmit}
            style={[styles.primaryButton, isSubmitting ? styles.primaryButtonDisabled : null]}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Enviar enlace</Text>
            )}
          </Pressable>

          <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: QuickBiteColors.white,
    borderRadius: 24,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: QuickBiteColors.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: QuickBiteColors.textSecondary,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: QuickBiteColors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: QuickBiteColors.border,
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 14,
    fontSize: 15,
    color: QuickBiteColors.text,
  },
  errorText: {
    fontSize: 13,
    color: QuickBiteColors.error,
  },
  primaryButton: {
    backgroundColor: QuickBiteColors.primary,
    borderRadius: 999,
    minHeight: 48,
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
  cancelText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: QuickBiteColors.textSecondary,
    paddingVertical: 8,
  },
});
