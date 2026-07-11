/**
 * types/restaurant.ts
 * Colección restaurants/{restId}
 */

import type { GeoPoint } from 'firebase/firestore';

export interface DaySchedule {
  open: string;
  close: string;
}

export type WeekSchedule = Partial<
  Record<
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday',
    DaySchedule
  >
>;

export type WeekDayKey = keyof WeekSchedule;

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisineTypes: string[];
  coverImage: string;
  logoImage: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  address: string;
  deliveryZone: number;
  isOpen: boolean;
  schedule?: WeekSchedule;
  /** La app cliente lee location como GeoPoint de Firestore. */
  location?: GeoPoint | { latitude: number; longitude: number } | null;
}
