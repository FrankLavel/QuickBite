/**
 * CuisineSelector.tsx
 * Selector de tipos de cocina (multi-selección con chips).
 * Los valores se guardan en restaurants/{id}.cuisineTypes y la app cliente
 * los usa para el filtro de categorías del Home.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CUISINE_OPTIONS } from '../utils/constants';
import { colors, radius, spacing, typography } from '../utils/theme';

interface CuisineSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function CuisineSelector({ value, onChange }: CuisineSelectorProps) {
  // Muestra las opciones estándar + cualquier valor ya guardado que no esté en la lista.
  const options = useMemo(() => {
    const extras = value.filter((v) => !CUISINE_OPTIONS.includes(v as never));
    return [...CUISINE_OPTIONS, ...extras];
  }, [value]);

  const toggle = (cuisine: string) => {
    if (value.includes(cuisine)) {
      onChange(value.filter((v) => v !== cuisine));
    } else {
      onChange([...value, cuisine]);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>TIPOS DE COCINA</Text>
      <Text style={styles.hint}>
        Elige una o varias. Así te encuentran los clientes en el Home de la app.
      </Text>
      <View style={styles.chips}>
        {options.map((cuisine) => {
          const active = value.includes(cuisine);
          return (
            <TouchableOpacity
              key={cuisine}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(cuisine)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {cuisine}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  chipTextActive: { color: colors.textOnPrimary },
});
