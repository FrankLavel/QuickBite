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
  /** Oculta los valores sobre cada barra (útil en series largas). */
  showValues?: boolean;
  /** Muestra la etiqueta solo cada N puntos (1 = todas). */
  labelInterval?: number;
}

export function MiniBarChart({
  data,
  height = 160,
  color = colors.primary,
  valueFormatter = (v) => String(v),
  showValues = true,
  labelInterval = 1,
}: MiniBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const hasData = data.some((d) => d.value > 0);
  // En series largas las barras se juntan para que quepan sin verse raquíticas.
  const dense = data.length > 14;
  const gap = dense ? 3 : spacing.sm;
  const topSpace = showValues ? 28 : 8;

  return (
    <View>
      <View style={[styles.plot, { height, gap }]}>
        {data.map((point, idx) => {
          const ratio = point.value / max;
          const barHeight = Math.max(4, Math.round(ratio * (height - topSpace)));
          const isPeak = point.value === max && point.value > 0;
          return (
            <View key={`${point.label}-${idx}`} style={styles.col}>
              {showValues ? (
                <Text style={styles.value}>
                  {point.value > 0 ? valueFormatter(point.value) : ''}
                </Text>
              ) : null}
              <View
                style={[
                  styles.bar,
                  dense && styles.barDense,
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

      <View style={[styles.labels, { gap }]}>
        {data.map((point, idx) => {
          const show =
            idx % labelInterval === 0 || idx === data.length - 1;
          return (
            <Text
              key={`${point.label}-l-${idx}`}
              style={styles.label}
              numberOfLines={1}
            >
              {show ? point.label : ''}
            </Text>
          );
        })}
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
  barDense: { width: '100%' },
  labels: {
    flexDirection: 'row',
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
