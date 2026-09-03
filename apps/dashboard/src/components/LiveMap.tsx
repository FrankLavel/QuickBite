/**
 * components/LiveMap.tsx
 * Mapa de ubicación en vivo. Esta es la versión base (nativa); en web se usa
 * LiveMap.web.tsx (embed de OpenStreetMap por iframe). El dashboard corre en web,
 * así que esta variante es un respaldo mínimo.
 */
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../utils/theme';

export interface LiveMapProps {
  lat: number;
  lng: number;
  height?: number;
}

export function LiveMap({ lat, lng, height = 320 }: LiveMapProps) {
  return (
    <View style={[styles.wrap, { height }]}>
      <Text style={styles.coords}>
        {lat.toFixed(5)}, {lng.toFixed(5)}
      </Text>
      <Text style={styles.note}>Mapa disponible en la versión web.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  coords: { ...typography.body, color: colors.text, fontWeight: '700' },
  note: { ...typography.caption, color: colors.textSecondary },
});
