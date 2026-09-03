/**
 * Tests de utils/schedule.ts — abierto/cerrado por horario y el contrato del
 * modo auto/manual (mismo criterio que la app móvil).
 * Se pasan fechas fijas para que los tests sean deterministas.
 */
import type { WeekSchedule } from '../../types/restaurant';
import { isOpenNow, isRestaurantOpenNow, getTodayHours } from '../schedule';

// 2026-01-05 es lunes; 2026-01-06 martes; 2026-01-09 viernes.
const MONDAY_NOON = new Date(2026, 0, 5, 12, 0);
const MONDAY_EARLY = new Date(2026, 0, 5, 8, 0);
const MONDAY_AT_CLOSE = new Date(2026, 0, 5, 18, 0);
const TUESDAY_NOON = new Date(2026, 0, 6, 12, 0);
const FRIDAY_NIGHT = new Date(2026, 0, 9, 23, 30);

const weekday: WeekSchedule = {
  monday: { open: '09:00', close: '18:00' },
  friday: { open: '20:00', close: '02:00' }, // cruza medianoche
};

describe('getTodayHours', () => {
  it('devuelve el horario del día correspondiente', () => {
    expect(getTodayHours(weekday, MONDAY_NOON)).toEqual({
      open: '09:00',
      close: '18:00',
    });
  });

  it('devuelve undefined si no hay horario o el día no está definido', () => {
    expect(getTodayHours(undefined, MONDAY_NOON)).toBeUndefined();
    expect(getTodayHours(weekday, TUESDAY_NOON)).toBeUndefined();
  });
});

describe('isOpenNow', () => {
  it('está abierto dentro del horario', () => {
    expect(isOpenNow(weekday, MONDAY_NOON)).toBe(true);
  });

  it('está cerrado antes de abrir', () => {
    expect(isOpenNow(weekday, MONDAY_EARLY)).toBe(false);
  });

  it('cierra en el minuto de cierre (intervalo semiabierto)', () => {
    expect(isOpenNow(weekday, MONDAY_AT_CLOSE)).toBe(false);
  });

  it('cerrado los días sin horario', () => {
    expect(isOpenNow(weekday, TUESDAY_NOON)).toBe(false);
  });

  it('sigue abierto pasada la noche cuando el horario cruza medianoche', () => {
    expect(isOpenNow(weekday, FRIDAY_NIGHT)).toBe(true);
  });
});

describe('isRestaurantOpenNow', () => {
  it('modo manual: respeta el interruptor isOpen sin mirar el horario', () => {
    expect(
      isRestaurantOpenNow(
        { isOpen: false, autoSchedule: false, schedule: weekday },
        MONDAY_NOON
      )
    ).toBe(false);
    expect(
      isRestaurantOpenNow(
        { isOpen: true, autoSchedule: false },
        MONDAY_AT_CLOSE
      )
    ).toBe(true);
  });

  it('modo automático: usa el horario', () => {
    expect(
      isRestaurantOpenNow({ isOpen: true, schedule: weekday }, MONDAY_NOON)
    ).toBe(true);
    expect(
      isRestaurantOpenNow({ isOpen: true, schedule: weekday }, MONDAY_EARLY)
    ).toBe(false);
  });

  it('modo automático sin horario: abierto por defecto', () => {
    expect(isRestaurantOpenNow({ isOpen: true }, MONDAY_NOON)).toBe(true);
    expect(
      isRestaurantOpenNow({ isOpen: true, schedule: {} }, MONDAY_NOON)
    ).toBe(true);
  });
});
