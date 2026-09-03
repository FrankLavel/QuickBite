/**
 * Tests de utils/format.ts — moneda, conversión a fecha y "hace X".
 */
import { formatCurrency, toDate, timeAgo } from '../format';

describe('formatCurrency', () => {
  it('formatea con dos decimales', () => {
    expect(formatCurrency(1234.5)).toContain('1,234.50');
  });
  it('trata no finitos como 0.00', () => {
    expect(formatCurrency(NaN)).toContain('0.00');
    expect(formatCurrency(Infinity)).toContain('0.00');
  });
});

describe('toDate', () => {
  it('acepta Date, número y Timestamp-like; null en lo demás', () => {
    const d = new Date(2030, 0, 1);
    expect(toDate(d)).toBe(d);
    expect(toDate(d.getTime())?.getTime()).toBe(d.getTime());
    expect(toDate({ toDate: () => d })).toBe(d);
    expect(toDate(null)).toBeNull();
    expect(toDate('no')).toBeNull();
  });
});

describe('timeAgo', () => {
  const now = new Date(2030, 0, 1, 12, 0, 0);
  it('muestra "recién" para menos de un minuto', () => {
    expect(timeAgo(now, now)).toBe('recién');
  });
  it('muestra minutos y horas', () => {
    expect(timeAgo(new Date(now.getTime() - 30 * 60000), now)).toBe('hace 30 min');
    expect(timeAgo(new Date(now.getTime() - 130 * 60000), now)).toBe('hace 2 h');
  });
});
