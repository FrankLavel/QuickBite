/**
 * utils/schedule.ts
 * Cálculo de abierto/cerrado a partir del horario semanal (mismo criterio que
 * la app móvil), para mostrar el estado efectivo en el header cuando el modo es
 * AUTOMÁTICO.
 */

import type { WeekSchedule } from '../types/restaurant';

const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

function toMinutes(t: string): number {
  const [h, m] = (t ?? '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function getTodayHours(schedule?: WeekSchedule, date = new Date()) {
  if (!schedule) return undefined;
  return schedule[DAY_KEYS[date.getDay()]];
}

/** ¿Estamos dentro del horario de hoy? */
export function isOpenNow(schedule?: WeekSchedule, date = new Date()): boolean {
  const today = getTodayHours(schedule, date);
  if (!today) return false;
  const cur = date.getHours() * 60 + date.getMinutes();
  const open = toMinutes(today.open);
  let close = toMinutes(today.close);
  if (close <= open) close += 24 * 60; // cruza medianoche
  return cur >= open && cur < close;
}

/** Estado efectivo abierto/cerrado según el modo (auto/manual). */
export function isRestaurantOpenNow(
  r: { isOpen: boolean; autoSchedule?: boolean; schedule?: WeekSchedule },
  date = new Date()
): boolean {
  if (r.autoSchedule === false) return r.isOpen !== false; // manual
  const hasSchedule = !!r.schedule && Object.keys(r.schedule).length > 0;
  return hasSchedule ? isOpenNow(r.schedule, date) : true; // automático
}
