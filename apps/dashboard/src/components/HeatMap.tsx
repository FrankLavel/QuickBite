/**
 * components/HeatMap.tsx
 * Mapa de calor día × hora (volumen de pedidos). Sin dependencias: la
 * intensidad se interpola sobre el verde de marca según el máximo de la matriz.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../utils/theme';

interface HeatMapProps {
  /** Matriz [fila][columna] con los conteos. */
  matrix: number[][];
  /** Etiquetas de fila (ej. días). */
  rowLabels: string[];
  /** Etiquetas de columna (ej. horas). */
  columnLabels: string[];
  /** Muestra la etiqueta de columna solo cada N (1 = todas). */
  columnLabelInterval?: number;
}

/** Escalones de intensidad, de menor a mayor. Siguen el tema activo. */
const STEPS = [
  colors.surfaceMuted,
  colors.heat1,
  colors.heat2,
  colors.heat3,
  colors.primary,
];

function cellColor(value: number, max: number): string {
  if (value <= 0 || max <= 0) return STEPS[0];
  const ratio = value / max;
  if (ratio <= 0.25) return STEPS[1];
  if (ratio <= 0.5) return STEPS[2];
  if (ratio <= 0.75) return STEPS[3];
  return STEPS[4];
}

export function HeatMap({
  matrix,
  rowLabels,
  columnLabels,
  columnLabelInterval = 1,
}: HeatMapProps) {
  const max = Math.max(0, ...matrix.flat());
  const hasData = max > 0;

  return (
    <View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Bajo</Text>
        {STEPS.map((c) => (
          <View key={c} style={[styles.legendSwatch, { backgroundColor: c }]} />
        ))}
        <Text style={styles.legendText}>Alto</Text>
      </View>

      {matrix.map((row, r) => (
        <View key={rowLabels[r] ?? r} style={styles.row}>
          <Text style={styles.rowLabel}>{rowLabels[r] ?? ''}</Text>
          <View style={styles.cells}>
            {row.map((value, c) => (
              <View
                key={`${r}-${c}`}
                style={[
                  styles.cell,
                  { backgroundColor: cellColor(value, max) },
                ]}
              />
            ))}
          </View>
        </View>
      ))}

      <View style={styles.axis}>
        <View style={styles.rowLabelSpacer} />
        <View style={styles.cells}>
          {columnLabels.map((label, c) => (
            <Text key={`col-${c}`} style={styles.colLabel} numberOfLines={1}>
              {c % columnLabelInterval === 0 ? label : ''}
            </Text>
          ))}
        </View>
      </View>

      {!hasData ? (
        <Text style={styles.empty}>
          Aún no hay pedidos suficientes para detectar horas pico.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginBottom: spacing.md,
  },
  legendText: { ...typography.caption, color: colors.textMuted },
  legendSwatch: { width: 14, height: 14, borderRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  rowLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    width: 38,
  },
  rowLabelSpacer: { width: 38 },
  cells: { flexDirection: 'row', flex: 1, gap: 3 },
  cell: { flex: 1, height: 18, borderRadius: 3 },
  axis: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  colLabel: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
