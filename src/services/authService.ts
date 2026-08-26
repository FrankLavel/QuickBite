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
  const cached = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
  if (cached) {
    const driver = JSON.parse(cached) as DriverUser;
    driver.isAvailable = isAvailable;
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(driver));
  }
}
