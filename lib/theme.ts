import { vars } from 'nativewind';

export type ColorScheme = 'light' | 'dark';
/** Esquema completo incluyendo la variante de alto contraste. */
export type FullScheme = 'light' | 'dark' | 'light-hc' | 'dark-hc';

// Valores de las variables de color por tema (formato "R G B" para rgb()).
const light = {
  '--color-background': '248 249 250',
  '--color-on-primary': '255 255 255',
  '--color-on-background': '25 28 29',
  '--color-on-surface': '25 28 29',
  '--color-on-surface-variant': '61 74 61',
  '--color-primary': '0 110 47',
  '--color-primary-dark': '22 163 74',
  '--color-primary-container': '34 197 94',
  '--color-on-primary-container': '0 75 30',
  '--color-secondary': '87 94 112',
  '--color-secondary-container': '217 223 245',
  '--color-on-secondary-container': '92 98 116',
  '--color-tertiary': '157 67 0',
  '--color-tertiary-container': '255 142 77',
  '--color-on-tertiary-container': '109 45 0',
  '--color-error': '186 26 26',
  '--color-error-container': '255 218 214',
  '--color-surface-container': '237 238 239',
  '--color-surface-container-low': '243 244 245',
  '--color-surface-container-lowest': '255 255 255',
  '--color-surface-container-high': '231 232 233',
  '--color-surface-container-highest': '225 227 228',
  '--color-surface-variant': '225 227 228',
  '--color-outline': '109 123 108',
  '--color-outline-variant': '188 203 185',
};

const dark = {
  '--color-background': '18 20 18',
  '--color-on-primary': '255 255 255',
  '--color-on-background': '227 227 225',
  '--color-on-surface': '227 227 225',
  '--color-on-surface-variant': '184 192 182',
  '--color-primary': '74 222 128',
  '--color-primary-dark': '22 163 74',
  '--color-primary-container': '20 83 45',
  '--color-on-primary-container': '187 247 208',
  '--color-secondary': '170 179 197',
  '--color-secondary-container': '58 65 82',
  '--color-on-secondary-container': '217 223 245',
  '--color-tertiary': '255 183 135',
  '--color-tertiary-container': '122 54 0',
  '--color-on-tertiary-container': '255 220 199',
  '--color-error': '255 107 107',
  '--color-error-container': '92 20 20',
  '--color-surface-container': '30 33 30',
  '--color-surface-container-low': '25 27 25',
  '--color-surface-container-lowest': '27 29 27',
  '--color-surface-container-high': '38 42 38',
  '--color-surface-container-highest': '46 50 46',
  '--color-surface-variant': '46 50 46',
  '--color-outline': '138 147 138',
  '--color-outline-variant': '65 72 65',
};

// Alto contraste: refuerza texto y bordes sin tocar el color de marca. Se
// mezcla sobre el esquema base (claro/oscuro).
const lightHCOverride = {
  '--color-on-background': '0 0 0',
  '--color-on-surface': '0 0 0',
  '--color-on-surface-variant': '26 26 26',
  '--color-secondary': '26 26 26',
  '--color-outline': '0 0 0',
  '--color-outline-variant': '90 90 90',
  '--color-primary': '0 83 30',
};

const darkHCOverride = {
  '--color-on-background': '255 255 255',
  '--color-on-surface': '255 255 255',
  '--color-on-surface-variant': '235 235 235',
  '--color-secondary': '235 235 235',
  '--color-outline': '255 255 255',
  '--color-outline-variant': '175 175 175',
  '--color-primary': '134 239 172',
};

export const themeVars: Record<FullScheme, ReturnType<typeof vars>> = {
  light: vars(light),
  dark: vars(dark),
  'light-hc': vars({ ...light, ...lightHCOverride }),
  'dark-hc': vars({ ...dark, ...darkHCOverride }),
};
