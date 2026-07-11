/**
 * Tokens del sistema de diseño para props que no aceptan className (p. ej. color
 * de íconos). Hay una paleta por tema; usa el hook useColors() para obtener la
 * correcta según el modo claro/oscuro. `palette` = tema claro (compat).
 */
export const lightPalette = {
  background: '#f8f9fa',
  onPrimary: '#ffffff',
  onSurface: '#191c1d',
  onSurfaceVariant: '#3d4a3d',
  primary: '#006e2f',
  primaryContainer: '#22c55e',
  onPrimaryContainer: '#004b1e',
  secondary: '#575e70',
  secondaryContainer: '#d9dff5',
  onSecondaryContainer: '#5c6274',
  'on-secondary-container': '#5c6274',
  tertiary: '#9d4300',
  tertiaryContainer: '#ff8e4d',
  onTertiaryContainer: '#6d2d00',
  'on-tertiary-container': '#6d2d00',
  error: '#ba1a1a',
  outline: '#6d7b6c',
  outlineVariant: '#bccbb9',
  surfaceContainer: '#edeeef',
  surfaceContainerLow: '#f3f4f5',
  surfaceContainerLowest: '#ffffff',
  star: '#eab308',
  white: '#ffffff',
};

export type Palette = typeof lightPalette;

export const darkPalette: Palette = {
  background: '#121412',
  onPrimary: '#ffffff',
  onSurface: '#e3e3e1',
  onSurfaceVariant: '#b8c0b6',
  primary: '#4ade80',
  primaryContainer: '#14532d',
  onPrimaryContainer: '#bbf7d0',
  secondary: '#aab3c5',
  secondaryContainer: '#3a4152',
  onSecondaryContainer: '#d9dff5',
  'on-secondary-container': '#d9dff5',
  tertiary: '#ffb787',
  tertiaryContainer: '#7a3600',
  onTertiaryContainer: '#ffdcc7',
  'on-tertiary-container': '#ffdcc7',
  error: '#ff6b6b',
  outline: '#8a938a',
  outlineVariant: '#414841',
  surfaceContainer: '#1e211e',
  surfaceContainerLow: '#191b19',
  surfaceContainerLowest: '#1b1d1b',
  star: '#eab308',
  white: '#ffffff',
};

/** Variantes de alto contraste: refuerzan texto/bordes inline. */
export const lightPaletteHC: Palette = {
  ...lightPalette,
  onSurface: '#000000',
  onSurfaceVariant: '#1a1a1a',
  secondary: '#1a1a1a',
  outline: '#000000',
  outlineVariant: '#5a5a5a',
  primary: '#00531e',
};

export const darkPaletteHC: Palette = {
  ...darkPalette,
  onSurface: '#ffffff',
  onSurfaceVariant: '#ebebeb',
  secondary: '#ebebeb',
  outline: '#ffffff',
  outlineVariant: '#afafaf',
  primary: '#86efac',
};

const PALETTES: Record<string, Palette> = {
  light: lightPalette,
  dark: darkPalette,
  'light-hc': lightPaletteHC,
  'dark-hc': darkPaletteHC,
};

let activePalette: Palette = lightPalette;

/** El root la actualiza al cambiar el tema; hace que `palette` sea dinámico. */
export function setPaletteScheme(scheme: string) {
  activePalette = PALETTES[scheme] ?? lightPalette;
}

/**
 * Paleta activa según el tema. Es un Proxy: cada lectura (`palette.primary`)
 * devuelve el valor del tema actual, así los colores inline responden al modo
 * claro/oscuro sin cambiar cada archivo. Se resuelve en cada render.
 */
export const palette: Palette = new Proxy({} as Palette, {
  get: (_target, prop: string) => activePalette[prop as keyof Palette],
}) as Palette;
