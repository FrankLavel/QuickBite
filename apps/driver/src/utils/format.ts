/**
 * utils/format.ts
 * Formateadores de moneda y fecha/hora (es-MX), consistentes con el ecosistema.
 */

const CURRENCY = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1234.5 → "$1,234.50". */
export function formatCurrency(value: number): string {
  return CURRENCY.format(Number.isFinite(value) ? value : 0);
}

/** Convierte un Timestamp de Firestore, Date o número a Date (o null). */
export function toDate(raw: unknown): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === 'object' && 'toDate' in raw) {
    return (raw as { toDate: () => Date }).toDate();
  }
  if (typeof raw === 'number') return new Date(raw);
  return null;
}

/** Hora corta local: "14:35". */
export function formatTime(raw: unknown): string {
  const d = toDate(raw);
  if (!d) return '';
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

/** "hace X min" a partir de una fecha. */
export function timeAgo(raw: unknown, now = new Date()): string {
  const d = toDate(raw);
  if (!d) return '';
  const mins = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60000));
  if (mins < 1) return 'recién';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  return `hace ${hours} h`;
}
