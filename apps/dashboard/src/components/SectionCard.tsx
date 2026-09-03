/**
 * components/SectionCard.tsx
 * Contenedor de sección reutilizable: tarjeta blanca con encabezado opcional
 * (título + subtítulo a la izquierda, acción a la derecha) y cuerpo.
 * Base visual consistente para todo el dashboard.
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../utils/theme';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  /** Quita el padding interno del cuerpo (para tablas a borde completo). */
  flush?: boolean;
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  style,
  flush,
}: SectionCardProps) {
  return (
    <View style={[styles.card, style]}>
      {title || action ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {action ? <View>{action}</View> : null}
        </View>
      ) : null}
      <View style={flush ? undefined : styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerText: { flex: 1 },
  title: { ...typography.h3, color: colors.text, fontWeight: '700' },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  body: { padding: spacing.lg, paddingTop: spacing.md },
});
