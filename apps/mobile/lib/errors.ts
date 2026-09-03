/**
 * lib/errors.ts
 * Utilidades para manejar errores de tipo `unknown` (bloques catch) de forma
 * segura, sin recurrir a `any`. Los errores de Firebase/Google Sign-In exponen
 * `code` (y a veces `message`); esta función los extrae con type guards.
 */

/** Devuelve el `code` de un error (o su `message`), o '' si no aplica. */
export function errorCode(e: unknown): string {
  if (typeof e === 'object' && e !== null) {
    if ('code' in e && typeof e.code === 'string') return e.code;
    if ('message' in e && typeof e.message === 'string') return e.message;
  }
  return '';
}
