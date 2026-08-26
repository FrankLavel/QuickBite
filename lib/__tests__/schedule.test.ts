/**
 * Tests de lib/schedule.ts — abierto/cerrado por horario y contrato auto/manual.
 * getTodayHours usa el día real, así que los horarios de prueba cubren los 7 días
 * (mismo horario) para ser deterministas; la fecha controla la hora.
 */
jest.mock('firebase/firestore', () => ({ Timestamp: {}, GeoPoint: class {} }));

import { isOpenNow, isRestaurantOpen } from '../schedule';
import type { WeekSchedule } from '@/types/restaurant.types';

function allDays(open: string, close: string): WeekSchedule {
  const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const s: Record<string, { open: string; close: string }> = {};
  for (const k of keys) s[k] = { open, close };
  return s as unknown as WeekSchedule;
}

describe('isOpenNow', () => {
  const nine18 = allDays('09:00', '18:00');
  const at = (h: number, m = 0) => new Date(2030, 5, 15, h, m);

  it('abierto dentro del horario, cerrado fuera', () => {
    expect(isOpenNow(nine18, at(12))).toBe(true);
    expect(isOpenNow(nine18, at(8))).toBe(false);
    expect(isOpenNow(nine18, at(18))).toBe(false); // intervalo semiabierto
  });
  it('sin horario está cerrado', () => {
    expect(isOpenNow(undefined, at(12))).toBe(false);
  });
  it('respeta horarios que cruzan medianoche', () => {
    const night = allDays('20:00', '02:00');
    expect(isOpenNow(night, at(23))).toBe(true);
    expect(isOpenNow(night, at(1))).toBe(false);
  });
});

describe('isRestaurantOpen', () => {
  it('modo manual respeta el interruptor isOpen', () => {
    expect(isRestaurantOpen({ autoSchedule: false, isOpen: false })).toBe(false);
    expect(isRestaurantOpen({ autoSchedule: false, isOpen: true })).toBe(true);
  });
  it('modo automático sin horario se considera abierto', () => {
    expect(isRestaurantOpen({ isOpen: true })).toBe(true);
    expect(isRestaurantOpen({ schedule: {} as WeekSchedule })).toBe(true);
  });
  it('modo automático con horario 24h está abierto', () => {
    expect(isRestaurantOpen({ autoSchedule: true, schedule: allDays('00:00', '00:00') })).toBe(true);
  });
  it('sin restaurante está cerrado', () => {
    expect(isRestaurantOpen(undefined)).toBe(false);
  });
});
