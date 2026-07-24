/**
 * utils/format.ts
 * Formateadores compartidos para todo el dashboard: moneda, números y
 * porcentajes con separadores de miles y estilo consistente (es-MX).
 */

const CURRENCY = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CURRENCY_COMPACT = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const NUMBER = new Intl.NumberFormat('es-MX');

/** Moneda con dos decimales: 1234.5 → "$1,234.50". */
export function formatCurrency(value: number): string {
  return CURRENCY.format(Number.isFinite(value) ? value : 0);
}

/** Moneda sin decimales, para KPIs grandes: 1234.5 → "$1,235". */
export function formatCurrencyCompact(value: number): string {
  return CURRENCY_COMPACT.format(Number.isFinite(value) ? value : 0);
}

/** Entero con separadores de miles: 1234 → "1,234". */
export function formatNumber(value: number): string {
  return NUMBER.format(Number.isFinite(value) ? value : 0);
}

/** Porcentaje con un decimal opcional: 12.34 → "12.3%". */
export function formatPercent(value: number, decimals = 1): string {
  const v = Number.isFinite(value) ? value : 0;
  return `${v.toFixed(decimals)}%`;
}

/** Variación porcentual con dirección, para pintar tendencias (▲/▼). */
export interface MetricDelta {
  /** Magnitud del cambio en porcentaje (siempre positiva). */
  percent: number;
  direction: 'up' | 'down' | 'flat';
}

/**
 * Variación porcentual entre el periodo actual y el anterior.
 * - previous 0 y current > 0 → +100% (up).
 * - ambos 0 → 0% (flat).
 */
export function computeDelta(current: number, previous: number): MetricDelta {
  if (previous === 0) {
    if (current === 0) return { percent: 0, direction: 'flat' };
    return { percent: 100, direction: 'up' };
  }
  const percent = ((current - previous) / previous) * 100;
  const direction = percent > 0.05 ? 'up' : percent < -0.05 ? 'down' : 'flat';
  return { percent: Math.abs(percent), direction };
}
