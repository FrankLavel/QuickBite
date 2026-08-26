/**
 * components/ScreenHeader.tsx
 * Encabezado de pantalla con título, subtítulo y contador opcional (theme-aware).
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, type Colors } from '../utils/theme';

interface Props {
  title: string;
  subtitle?: string;
  count?: number;
}

export function ScreenHeader({ title, subtitle, count }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {typeof count === 'number' ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: c.bg,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    title: { fontSize: 24, fontWeight: '800', color: c.text },
    badge: {
      backgroundColor: c.brand,
      borderRadius: radius.pill,
      minWidth: 24,
      paddingHorizontal: 8,
      paddingVertical: 2,
      alignItems: 'center',
    },
    badgeText: { color: c.textInverse, fontWeight: '800', fontSize: 13 },
    subtitle: { fontSize: 14, color: c.textMuted, marginTop: 2 },
  });
