/**
 * utils/theme.ts
 * Paletas claro/oscuro + tokens de espaciado/radio. Los componentes obtienen la
 * paleta activa con useTheme() (ver context/ThemeContext) y construyen sus estilos
 * a partir de ella, para soportar modo oscuro.
 */

export interface Colors {
  brand: string;
  brandDark: string;
  brandSoft: string;

  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;

  text: string;
  textMuted: string;
  textInverse: string;

  success: string;
  warning: string;
  danger: string;
  info: string;
}

export const lightColors: Colors = {
  brand: '#2caf4b',
  brandDark: '#086931',
  brandSoft: '#eef8f1',

  bg: '#f5f6f8',
  surface: '#ffffff',
  surfaceMuted: '#eef0f3',
  border: '#e6e8eb',

  text: '#1a1d1f',
  textMuted: '#6b7280',
  textInverse: '#ffffff',

  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#2563eb',
};

export const darkColors: Colors = {
  brand: '#2caf4b',
  brandDark: '#5ed17d',
  brandSoft: '#13251b',

  bg: '#0f1115',
  surface: '#171a20',
  surfaceMuted: '#1f242c',
  border: '#2a2f38',

  text: '#f3f5f7',
  textMuted: '#9aa3af',
  textInverse: '#0f1115',

  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
  info: '#60a5fa',
};

/** Color asociado a cada estado de pedido, dado un tema. */
export function statusColorFor(colors: Colors, status: string): string {
  switch (status) {
    case 'ready':
      return colors.warning;
    case 'on_the_way':
      return colors.info;
    case 'delivered':
      return colors.success;
    default:
      return colors.textMuted;
  }
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};
