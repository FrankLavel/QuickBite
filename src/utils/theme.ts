/**
 * theme.ts
 * Paleta QuickBite — verdes del mockup oficial.
 */

export const colors = {
  /** Verde principal — sidebar, botones */
  primary: '#086931',
  primaryDark: '#065a28',
  /** Verde vibrante — iconos, barras de progreso */
  primaryLight: '#24e275',
  /** Fondo degradado / superficies suaves */
  primarySoft: '#eef8f1',
  /** Verde suave — textos descriptivos sobre fondos oscuros */
  textSoft: '#90d3a5',
  accent: '#24e275',

  black: '#1f2937',
  blackSoft: '#374151',

  /** Fondo de página neutro (estilo mockup) — el verde queda para acentos. */
  background: '#F4F6F8',
  surface: '#FFFFFF',
  /** Rellenos suaves neutros (chips inactivos, botones sutiles). */
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
};

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
