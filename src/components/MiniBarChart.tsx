/**
 * components/MiniBarChart.tsx
 * Gráfico de barras ligero (solo Views, sin dependencias). Escala las barras
 * al valor máximo y muestra etiquetas. Pensado para series cortas (7–8 puntos).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../utils/theme';

export interface BarPoint {
  label: string;
  value: number;
}

interface MiniBarChartProps {
  data: BarPoint[];
  height?: number;
  color?: string;
  /** Formatea el valor mostrado sobre la barra más alta / al tocar. */
  valueFormatter?: (v: number) => string;
}

export function MiniBarChart({
  data,
  height = 160,
  color = colors.primary,
  valueFormatter = (v) => String(v),
}: MiniBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const hasData = data.some((d) => d.value > 0);

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {data.map((point, idx) => {
          const ratio = point.value / max;
          const barHeight = Math.max(4, Math.round(ratio * (height - 28)));
          const isPeak = point.value === max && point.value > 0;
          return (
            <View key={`${point.label}-${idx}`} style={styles.col}>
              <Text style={styles.value}>
                {point.value > 0 ? valueFormatter(point.value) : ''}
              </Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: isPeak ? color : colors.primarySoft,
                    borderColor: isPeak ? color : colors.border,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.labels}>
        {data.map((point, idx) => (
          <Text key={`${point.label}-l-${idx}`} style={styles.label}>
            {point.label}
          </Text>
        ))}
      </View>

      {!hasData ? (
        <Text style={styles.empty}>
          Aún no hay datos suficientes para este periodo.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  value: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 10,
  },
  bar: {
    width: '72%',
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    borderWidth: 1,
  },
  labels: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
