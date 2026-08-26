/**
 * Tests de utils/format.ts — formato de moneda/números y variación porcentual.
 * Las aserciones de moneda usan `toContain` para ser robustas ante variaciones
 * de ICU entre versiones de Node (símbolo/espacios), fijando solo el número.
 */
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  formatPercent,
  computeDelta,
} from '../format';

describe('formatNumber', () => {
  it('agrupa miles con estilo es-MX', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('devuelve 0 ante valores no finitos', () => {
    expect(formatNumber(NaN)).toBe('0');
    expect(formatNumber(Infinity)).toBe('0');
  });
});

describe('formatCurrency', () => {
  it('formatea con dos decimales', () => {
    expect(formatCurrency(1234.5)).toContain('1,234.50');
  });

  it('trata valores no finitos como 0.00', () => {
    expect(formatCurrency(NaN)).toContain('0.00');
  });
});

describe('formatCurrencyCompact', () => {
  it('redondea a entero para KPIs grandes', () => {
    expect(formatCurrencyCompact(1234.5)).toContain('1,235');
  });
});

describe('formatPercent', () => {
  it('usa un decimal por defecto', () => {
    expect(formatPercent(12.34)).toBe('12.3%');
  });

  it('respeta el número de decimales indicado', () => {
    expect(formatPercent(12.34, 0)).toBe('12%');
    expect(formatPercent(12.34, 2)).toBe('12.34%');
  });

  it('trata no finitos como 0', () => {
    expect(formatPercent(NaN)).toBe('0.0%');
  });
});

describe('computeDelta', () => {
  it('marca +100% up cuando el periodo anterior es 0 y el actual positivo', () => {
    expect(computeDelta(100, 0)).toEqual({ percent: 100, direction: 'up' });
  });

  it('marca flat cuando ambos periodos son 0', () => {
    expect(computeDelta(0, 0)).toEqual({ percent: 0, direction: 'flat' });
  });

  it('calcula subida', () => {
    expect(computeDelta(150, 100)).toEqual({ percent: 50, direction: 'up' });
  });

  it('calcula bajada con magnitud positiva', () => {
    expect(computeDelta(50, 100)).toEqual({ percent: 50, direction: 'down' });
  });

  it('marca flat cuando el cambio es despreciable (< 0.05%)', () => {
    const d = computeDelta(100.02, 100);
    expect(d.direction).toBe('flat');
  });
});
