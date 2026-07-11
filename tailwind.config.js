/** @type {import('tailwindcss').Config} */
const c = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Colores como variables CSS para soportar tema claro/oscuro.
      // Los valores se definen en lib/theme.ts (themeVars) y se aplican en el root.
      colors: {
        background: c("background"),
        "on-primary": c("on-primary"),
        "on-background": c("on-background"),
        "on-surface": c("on-surface"),
        "on-surface-variant": c("on-surface-variant"),
        primary: c("primary"),
        "primary-dark": c("primary-dark"),
        "primary-container": c("primary-container"),
        "on-primary-container": c("on-primary-container"),
        secondary: c("secondary"),
        "secondary-container": c("secondary-container"),
        "on-secondary-container": c("on-secondary-container"),
        tertiary: c("tertiary"),
        "tertiary-container": c("tertiary-container"),
        "on-tertiary-container": c("on-tertiary-container"),
        error: c("error"),
        "error-container": c("error-container"),
        "surface-container": c("surface-container"),
        "surface-container-low": c("surface-container-low"),
        "surface-container-lowest": c("surface-container-lowest"),
        "surface-container-high": c("surface-container-high"),
        "surface-container-highest": c("surface-container-highest"),
        "surface-variant": c("surface-variant"),
        outline: c("outline"),
        "outline-variant": c("outline-variant"),
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
    },
  },
};
