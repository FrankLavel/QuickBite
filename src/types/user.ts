/**
 * types/user.ts
 * users/{uid} — en esta app solo interesan las cuentas con role = 'driver'.
 * El rol lo provisiona el administrador por consola (no hay autorregistro de driver).
 */

export type UserRole = 'customer' | 'restaurant' | 'driver';

export interface DriverUser {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  /** El repartidor marca si está disponible para recibir entregas. */
  isAvailable?: boolean;
  /** Descripción libre del vehículo (moto, bici, auto…). Opcional. */
  vehicle?: string;
}
