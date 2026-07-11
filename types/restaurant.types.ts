import { GeoPoint } from 'firebase/firestore';

export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DaySchedule {
  /** Hora de apertura "HH:mm" (ej: "09:00"). */
  open: string;
  /** Hora de cierre "HH:mm" (ej: "22:00"). */
  close: string;
}

export type WeekSchedule = Partial<Record<WeekDay, DaySchedule>>;

/** Documento /restaurants/{restId}. Solo lectura desde la app móvil. */
export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisineTypes: string[];
  coverImage: string;
  logoImage: string;
  rating: number;
  reviewCount: number;
  /** Tiempo estimado de entrega como texto: "25-35 min". */
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  location: GeoPoint;
  address: string;
  /** Radio de cobertura de entrega en kilómetros. */
  deliveryZone: number;
  isOpen: boolean;
  schedule: WeekSchedule;
}
