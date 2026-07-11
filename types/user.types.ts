import { Timestamp } from 'firebase/firestore';

/**
 * 'customer' se autoregistra desde la app móvil. 'restaurant' (dueño/staff del
 * Dashboard Web) se provisiona por fuera del cliente (Admin SDK/Cloud Function);
 * Security Rules nunca permite que un cliente se autoasigne este rol.
 */
export type UserRole = 'customer' | 'restaurant';

export interface Address {
  label: string;
  street: string;
  city: string;
  references?: string;
  coords: { lat: number; lng: number };
  isDefault: boolean;
}

/** Documento /users/{uid}. uid = ID del documento (UID de Firebase Auth). */
export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  /** Solo presente si role = 'restaurant'. FK al restaurante que administra. */
  restaurantId?: string;
  addresses: Address[];
  favoriteIds: string[];
  /** Platillos favoritos como claves "restaurantId|productId". */
  favoriteProductIds: string[];
  pushToken?: string;
  darkMode: boolean;
  createdAt: Timestamp;
}
