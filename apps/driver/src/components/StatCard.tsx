/**
 * components/StatCard.tsx
 * Tarjeta de KPI con ícono, etiqueta y valor (theme-aware).
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, type Colors } from '../utils/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone?: 'brand' | 'info' | 'success' | 'warning';
}

export function StatCard({ icon, label, value, tone = 'brand' }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tint = colors[tone];
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${tint}22` }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    card: {
      flexGrow: 1,
      flexBasis: 100,
      minWidth: 100,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      gap: 4,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    value: { fontSize: 20, fontWeight: '800', color: c.text },
    label: { fontSize: 12, color: c.textMuted, fontWeight: '600' },
  });
