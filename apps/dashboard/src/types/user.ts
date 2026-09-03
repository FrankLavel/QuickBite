/**
 * types/user.ts
 * Colección users/{uid} — perfil de cliente o restaurante (campo role).
 */

export type UserRole = 'customer' | 'restaurant';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  /** Solo si role = 'restaurant'. FK -> restaurants/{restId} */
  restaurantId?: string;
  darkMode?: boolean;
  createdAt?: unknown;
}
