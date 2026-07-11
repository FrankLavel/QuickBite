import { DaySchedule, WeekDay, WeekSchedule } from '@/types/restaurant.types';

// getDay(): 0 = domingo ... 6 = sábado
const DAY_KEYS: WeekDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Nombre completo del día por clave abreviada. El dashboard del restaurante
 * escribe el schedule con claves largas (monday, friday...), así que aquí
 * toleramos ambos formatos al leer.
 */
const FULL_DAY: Record<WeekDay, string> = {
  sun: 'sunday',
  mon: 'monday',
  tue: 'tuesday',
  wed: 'wednesday',
  thu: 'thursday',
  fri: 'friday',
  sat: 'saturday',
};

export function todayKey(date = new Date()): WeekDay {
  return DAY_KEYS[date.getDay()];
}

export function getTodayHours(schedule?: WeekSchedule): DaySchedule | undefined {
  const key = todayKey();
  // Acepta clave abreviada ('fri') o completa ('friday') indistintamente.
  const flexible = schedule as
    | Partial<Record<string, DaySchedule>>
    | undefined;
  return flexible?.[key] ?? flexible?.[FULL_DAY[key]];
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Calcula si el restaurante está abierto ahora según su horario de hoy. */
export function isOpenNow(schedule?: WeekSchedule, date = new Date()): boolean {
  const today = getTodayHours(schedule);
  if (!today) return false;
  const cur = date.getHours() * 60 + date.getMinutes();
  const open = toMinutes(today.open);
  let close = toMinutes(today.close);
  if (close <= open) close += 24 * 60; // cruza medianoche
  return cur >= open && cur < close;
}

/** Texto del horario de hoy, p.ej. "09:00 - 22:00" o "Cerrado hoy". */
export function todayHoursLabel(schedule?: WeekSchedule): string {
  const today = getTodayHours(schedule);
  return today ? `${today.open} - ${today.close}` : 'Cerrado hoy';
}
