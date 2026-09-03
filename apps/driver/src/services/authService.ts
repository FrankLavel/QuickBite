/**
 * services/authService.ts
 * Autenticación del repartidor: login por correo/contraseña con verificación de
 * rol 'driver', carga/persistencia de sesión y cierre de sesión.
 */
import {
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebase';
import { COLLECTIONS, STORAGE_KEYS } from '../utils/constants';
import type { DriverUser } from '../types/user';

export class NotADriverError extends Error {
  constructor() {
    super('Esta cuenta no es de repartidor.');
    this.name = 'NotADriverError';
  }
}

export async function fetchDriverProfile(
  fbUser: FirebaseUser
): Promise<DriverUser> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, fbUser.uid));
  const data = snap.data();
  if (!snap.exists() || data?.role !== 'driver') {
    // La cuenta existe en Auth pero no es un repartidor provisionado.
    await signOut(auth).catch(() => undefined);
    throw new NotADriverError();
  }
  const driver: DriverUser = {
    uid: fbUser.uid,
    name: (data.name as string) ?? fbUser.displayName ?? 'Repartidor',
    email: (data.email as string) ?? fbUser.email ?? '',
    phone: data.phone as string | undefined,
    role: 'driver',
    isAvailable: data.isAvailable !== false,
    vehicle: data.vehicle as string | undefined,
  };
  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(driver));
  return driver;
}

export async function loginDriver(
  email: string,
  password: string
): Promise<DriverUser> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return fetchDriverProfile(cred.user);
}

export async function logoutDriver(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  await signOut(auth);
}

/** Cambia la disponibilidad del repartidor (users/{uid}.isAvailable). */
export async function setAvailability(
  uid: string,
  isAvailable: boolean
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), { isAvailable });
  await patchCachedDriver(uid, { isAvailable });
}

/** Campos del perfil que el repartidor puede editar desde la app. */
export type EditableProfile = Pick<DriverUser, 'name' | 'phone' | 'vehicle'>;

/**
 * Actualiza el perfil editable del repartidor (users/{uid}) y refresca la caché
 * local. Normaliza espacios; teléfono/vehículo vacíos se guardan como ''.
 */
export async function updateDriverProfile(
  uid: string,
  patch: EditableProfile
): Promise<EditableProfile> {
  const clean: EditableProfile = {
    name: patch.name.trim(),
    phone: (patch.phone ?? '').trim(),
    vehicle: (patch.vehicle ?? '').trim(),
  };
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), clean);
  await patchCachedDriver(uid, clean);
  return clean;
}

/** Mezcla cambios en el DriverUser cacheado (AsyncStorage), si existe. */
async function patchCachedDriver(
  uid: string,
  patch: Partial<DriverUser>
): Promise<void> {
  const cached = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
  if (!cached) return;
  const driver = JSON.parse(cached) as DriverUser;
  if (driver.uid !== uid) return;
  await AsyncStorage.setItem(
    STORAGE_KEYS.AUTH_USER,
    JSON.stringify({ ...driver, ...patch })
  );
}
