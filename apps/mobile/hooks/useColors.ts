import { useAuthStore } from '@/store/authStore';
import { useA11yStore } from '@/store/a11yStore';
import {
  lightPalette,
  darkPalette,
  lightPaletteHC,
  darkPaletteHC,
  Palette,
} from '@/constants/colors';
import { ColorScheme, FullScheme } from '@/lib/theme';

/** Tema base derivado de la preferencia del usuario (user.darkMode). */
export function useThemeScheme(): ColorScheme {
  const darkMode = useAuthStore((s) => s.user?.darkMode ?? false);
  return darkMode ? 'dark' : 'light';
}

/** Esquema completo: base (claro/oscuro) + alto contraste (accesibilidad). */
export function useFullScheme(): FullScheme {
  const base = useThemeScheme();
  const highContrast = useA11yStore((s) => s.highContrast);
  return highContrast ? (`${base}-hc` as FullScheme) : base;
}

/** Paleta de colores para props inline (íconos, etc.) según el esquema completo. */
export function useColors(): Palette {
  const scheme = useFullScheme();
  switch (scheme) {
    case 'dark':
      return darkPalette;
    case 'light-hc':
      return lightPaletteHC;
    case 'dark-hc':
      return darkPaletteHC;
    default:
      return lightPalette;
  }
}
