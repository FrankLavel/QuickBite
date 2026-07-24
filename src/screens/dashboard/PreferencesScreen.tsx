/**
 * screens/dashboard/PreferencesScreen.tsx
 * Preferencias de la app (cuenta local): notificaciones, accesibilidad y
 * apariencia. Persistidas en el dispositivo vía utils/preferences.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { SectionCard } from '../../components/SectionCard';
import {
  usePreferences,
  setPreference,
  type Preferences,
} from '../../utils/preferences';
import { colors, radius, spacing, typography } from '../../utils/theme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

export function PreferencesScreen() {
  const prefs = usePreferences();

  return (
    <ScreenShell searchPlaceholder="Buscar en preferencias...">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.pageHead}>
          <Text style={styles.title}>Preferencias</Text>
          <Text style={styles.subtitle}>
            Ajustes de la app en este dispositivo: avisos, accesibilidad y
            apariencia
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.cardWrap}>
          <SectionCard
            title="Notificaciones"
            subtitle="Cómo te avisamos de los pedidos nuevos"
          >
            <ToggleRow
              icon="volume-2"
              label="Sonido de pedidos"
              description="Reproduce un tono al entrar un pedido nuevo."
              value={prefs.orderSound}
              onValueChange={(v) => setPreference('orderSound', v)}
            />
            <Divider />
            <ToggleRow
              icon="bell"
              label="Avisos emergentes"
              description="Muestra la tarjeta de 'Nuevo pedido' en cualquier pantalla."
              value={prefs.orderToast}
              onValueChange={(v) => setPreference('orderToast', v)}
            />
          </SectionCard>
          </View>

          <View style={styles.cardWrap}>
          <SectionCard
            title="Accesibilidad"
            subtitle="Comodidad de uso"
          >
            <ToggleRow
              icon="wind"
              label="Reducir animaciones"
              description="Minimiza los efectos de movimiento de la interfaz."
              value={prefs.reduceMotion}
              onValueChange={(v) => setPreference('reduceMotion', v)}
            />
          </SectionCard>
          </View>

          <View style={styles.cardWrap}>
          <SectionCard title="Apariencia" subtitle="Tema de la app">
            <ThemeOption
              active={prefs.theme}
              onSelect={(t) => setPreference('theme', t)}
            />
            <Text style={styles.themeHint}>
              El tema se aplica al instante y se recuerda en este dispositivo.
            </Text>
          </SectionCard>
          </View>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  value,
  onValueChange,
}: {
  icon: FeatherIconName;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

function ThemeOption({
  active,
  onSelect,
}: {
  active: Preferences['theme'];
  onSelect: (t: Preferences['theme']) => void;
}) {
  const options: Array<{
    key: Preferences['theme'];
    label: string;
    icon: FeatherIconName;
  }> = [
    { key: 'light', label: 'Claro', icon: 'sun' },
    { key: 'dark', label: 'Oscuro', icon: 'moon' },
  ];
  return (
    <View style={styles.themeRow}>
      {options.map((o) => {
        const selected = active === o.key;
        return (
          <TouchableOpacity
            key={o.key}
            style={[styles.themeCard, selected && styles.themeCardActive]}
            activeOpacity={0.85}
            // Selección real (se guarda); el repintado llega con el rollout.
            onPress={() => onSelect(o.key)}
          >
            <Feather
              name={o.icon}
              size={20}
              color={selected ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.themeLabel,
                selected && styles.themeLabelActive,
              ]}
            >
              {o.label}
            </Text>
            {selected ? (
              <View style={styles.themeCheck}>
                <Feather name="check" size={12} color={colors.textOnPrimary} />
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  pageHead: {},
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  cardWrap: {
    flexGrow: 1,
    flexBasis: 360,
    minWidth: 300,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { ...typography.body, color: colors.text, fontWeight: '700' },
  rowDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  themeRow: { flexDirection: 'row', gap: spacing.md },
  themeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  themeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  themeLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  themeLabelActive: { color: colors.primary },
  themeCheck: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
