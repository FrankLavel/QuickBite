/**
 * utils/imageUrl.ts
 * Normaliza URLs de imagen y placeholder local (sin depender de red externa).
 */

/** Placeholder SVG embebido — siempre carga en web y móvil */
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#eef8f1"/>
      <circle cx="200" cy="115" r="40" fill="#90d3a5" opacity="0.5"/>
      <path d="M120 210 L180 150 L220 185 L280 120 L320 210 Z" fill="#086931" opacity="0.25"/>
      <text x="200" y="250" text-anchor="middle" fill="#086931" font-family="sans-serif" font-size="16" font-weight="600">Sin imagen</text>
    </svg>`
  );

/** URIs locales o vacías no sirven fuera del formulario */
export function normalizeImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('content:')
  ) {
    return null;
  }
  return trimmed;
}

export function resolveProductImageUrl(url?: string | null): string {
  return normalizeImageUrl(url) ?? PLACEHOLDER_IMAGE;
}
