/**
 * theme.ts
 * Paleta QuickBite con soporte de modo claro/oscuro.
 *
 * Estrategia (web): cada color es una **variable CSS** con el valor claro como
 * fallback, p. ej. `var(--qb-surface, #FFFFFF)`. Los estilos (incluso los de
 * StyleSheet.create a nivel de módulo) capturan ese string una sola vez, pero
 * el navegador resuelve la variable en tiempo real. `applyTheme()` cambia los
 * valores de las variables → toda la app se repinta sin tocar componentes.
 * En nativo (sin CSS vars) se usan directamente los valores claros.
 */

import { Platform } from 'react-native';

export interface Palette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
  textSoft: string;
  accent: string;
  black: string;
  blackSoft: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  inputBackground: string;
  sidebar: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnSidebar: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
  border: string;
  overlay: string;
  /** Pasos intermedios del degradado del mapa de calor (bajo → alto). */
  heat1: string;
  heat2: string;
  heat3: string;
}

/** Paleta clara — verdes del mockup oficial (valores originales). */
export const lightPalette: Palette = {
  primary: '#086931',
  primaryDark: '#065a28',
  primaryLight: '#24e275',
  primarySoft: '#eef8f1',
  textSoft: '#90d3a5',
  accent: '#24e275',
  black: '#1f2937',
  blackSoft: '#374151',
  background: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF0F4',
  inputBackground: '#FFFFFF',
  sidebar: '#086931',
  text: '#1f2937',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnSidebar: '#FFFFFF',
  success: '#086931',
  successSoft: '#eef8f1',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  info: '#2563EB',
  infoSoft: '#DBEAFE',
  border: 'rgba(31, 41, 55, 0.12)',
  overlay: 'rgba(31, 41, 55, 0.45)',
  heat1: '#d7efe0',
  heat2: '#9bd9b5',
  heat3: '#4cb87c',
};

/** Paleta oscura — superficies slate + acentos aclarados para contraste. */
export const darkPalette: Palette = {
  primary: '#16a34a',
  primaryDark: '#4ade80',
  primaryLight: '#24e275',
  primarySoft: 'rgba(34, 197, 94, 0.16)',
  textSoft: '#90d3a5',
  accent: '#24e275',
  black: '#334155',
  blackSoft: '#475569',
  background: '#0b1220',
  surface: '#161f2e',
  surfaceMuted: '#1f2a3b',
  inputBackground: '#1f2a3b',
  sidebar: '#086931',
  text: '#f1f5f9',
  textSecondary: '#b6c2d1',
  textMuted: '#8593a5',
  textOnPrimary: '#FFFFFF',
  textOnSidebar: '#FFFFFF',
  success: '#34d399',
  successSoft: 'rgba(52, 211, 153, 0.15)',
  danger: '#e5555a',
  dangerSoft: 'rgba(229, 85, 90, 0.16)',
  warning: '#fbbf24',
  warningSoft: 'rgba(251, 191, 36, 0.15)',
  info: '#60a5fa',
  infoSoft: 'rgba(96, 165, 250, 0.16)',
  border: 'rgba(255, 255, 255, 0.10)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  // Verde de marca con opacidad creciente sobre la superficie oscura.
  heat1: 'rgba(34, 197, 94, 0.22)',
  heat2: 'rgba(34, 197, 94, 0.45)',
  heat3: 'rgba(34, 197, 94, 0.70)',
};

const KEYS = Object.keys(lightPalette) as Array<keyof Palette>;

/** Nombre de variable CSS para una clave (surfaceMuted → --qb-surface-muted). */
function cssVar(key: keyof Palette): string {
  return `--qb-${String(key).replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`;
}

const isWeb = Platform.OS === 'web';

/**
 * Objeto de colores consumido por toda la app. En web cada valor es una
 * referencia a variable CSS con fallback claro; en nativo, el valor claro.
 */
export const colors: Palette = (() => {
  const out = {} as Palette;
  for (const key of KEYS) {
    out[key] = isWeb
      ? `var(${cssVar(key)}, ${lightPalette[key]})`
      : lightPalette[key];
  }
  return out;
})();

export type ThemeMode = 'light' | 'dark';

/** Aplica una paleta escribiendo las variables CSS en el documento (web). */
export function applyTheme(mode: ThemeMode): void {
  if (!isWeb || typeof document === 'undefined') return;
  const palette = mode === 'dark' ? darkPalette : lightPalette;
  const root = document.documentElement;
  for (const key of KEYS) {
    root.style.setProperty(cssVar(key), palette[key]);
  }
  // Ayuda a barras de scroll / controles nativos del navegador.
  root.style.colorScheme = mode;
  if (document.body) {
    document.body.style.backgroundColor = palette.background;
  }
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.6 },
  caption: { fontSize: 12, fontWeight: '400' as const },
};

export const shadows = {
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  fab: {
    shadowColor: '#086931',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
};
