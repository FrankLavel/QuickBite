/**
 * ModalFormShell.tsx
 * Formulario modal centrado con ancho máximo (no ocupa toda la pantalla en desktop).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../../utils/theme';

export const FORM_MODAL_MAX_WIDTH = 560;

interface ModalFormShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Texto opcional bajo el título */
  subtitle?: string;
}

export function ModalFormShell({
  title,
  onClose,
  children,
  subtitle,
}: ModalFormShellProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - spacing.lg * 2, FORM_MODAL_MAX_WIDTH);

  return (
    <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
      <KeyboardAvoidingView
        style={styles.center}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <View style={[styles.card, { width: cardWidth, maxWidth: FORM_MODAL_MAX_WIDTH }]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              style={styles.closeBtn}
              accessibilityLabel="Cerrar formulario"
            >
              <Feather name="x" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  card: {
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
    ...Platform.select({
      web: { boxShadow: '0 20px 48px rgba(0,0,0,0.18)' as unknown as undefined },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerText: { flex: 1, paddingRight: spacing.sm },
  title: { ...typography.h2, color: colors.text },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flexGrow: 0 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
