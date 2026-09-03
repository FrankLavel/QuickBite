/**
 * services/authService.ts
 * Auth + users/{uid} con role='restaurant' y restaurantId.
 * Al registrar: crea Auth, documento users y documento restaurants.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { Platform } from 'react-native';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { COLLECTIONS } from '../utils/constants';
import { getAuthErrorMessage, getErrorMessage, getFirestorePermissionMessage } from '../utils/validation';
import type { AppUser } from '../types/user';
import type { Restaurant } from '../types/restaurant';

export interface RegisterRestaurantInput {
  email: string;
  password: string;
  name: string;
  restaurantName: string;
  phone?: string;
  address?: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function rollbackFailedRegistration(fbUser: User): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, fbUser.uid));
  } catch {
    // El documento puede no existir si falló antes de crearse
  }
  try {
    await fbUser.delete();
  } catch {
    await firebaseSignOut(auth);
  }
}

async function verifyRestaurantDocuments(
  uid: string,
  restId: string
): Promise<void> {
  const [userSnap, restSnap] = await Promise.all([
    getDoc(doc(db, COLLECTIONS.USERS, uid)),
    getDoc(doc(db, COLLECTIONS.RESTAURANTS, restId)),
  ]);

  if (!userSnap.exists() || !restSnap.exists()) {
    throw new Error(
      'Los datos del restaurante no se guardaron en Firestore. ' +
        'Publica las reglas de firestore.rules.example en Firebase Console → Firestore → Reglas.'
    );
  }
}

function mapUser(uid: string, data: Record<string, unknown>, email: string): AppUser {
  return {
    uid,
    name: (data.name as string) ?? '',
    email: (data.email as string) ?? email,
    phone: data.phone as string | undefined,
    photoURL: data.photoURL as string | undefined,
    role: (data.role as AppUser['role']) ?? 'restaurant',
    restaurantId: data.restaurantId as string | undefined,
    darkMode: Boolean(data.darkMode),
    createdAt: data.createdAt,
  };
}

function mapRestaurant(id: string, data: Record<string, unknown>): Restaurant {
  return {
    id,
    name: (data.name as string) ?? '',
    description: (data.description as string) ?? '',
    cuisineTypes: (data.cuisineTypes as string[]) ?? [],
    coverImage: (data.coverImage as string) ?? '',
    logoImage: (data.logoImage as string) ?? '',
    rating: Number(data.rating) || 0,
    reviewCount: Number(data.reviewCount) || 0,
    deliveryTime: (data.deliveryTime as string) ?? '25-35 min',
    deliveryFee: Number(data.deliveryFee) || 0,
    minOrder: Number(data.minOrder) || 0,
    address: (data.address as string) ?? '',
    deliveryZone: Number(data.deliveryZone) || 5,
    isOpen: data.isOpen !== false,
    schedule: data.schedule as Restaurant['schedule'],
    location: data.location as Restaurant['location'],
  };
}

function buildDefaultRestaurantData(restId: string, name: string, address = '') {
  return {
    id: restId,
    name,
    description: '',
    cuisineTypes: [] as string[],
    coverImage: '',
    logoImage: '',
    rating: 0,
    reviewCount: 0,
    deliveryTime: '25-35 min',
    deliveryFee: 0,
    minOrder: 0,
    address,
    deliveryZone: 5,
    isOpen: true,
    schedule: {},
  };
}

async function resolveLoginError(email: string, code?: string): Promise<string> {
  const normalized = normalizeEmail(email);

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, normalized);

      if (methods.length === 0) {
        return (
          'No hay cuenta con este correo. Si intentaste registrarte y falló, ' +
          'publica las reglas de firestore.rules.example y regístrate de nuevo.'
        );
      }

      if (methods.includes('google.com') && !methods.includes('password')) {
        return (
          'Este correo está vinculado a Google, no a contraseña. ' +
          'Usa el botón "Continuar con Google" para entrar.'
        );
      }

      if (methods.includes('password')) {
        return (
          'La contraseña no es correcta. Si olvidaste la contraseña, usa ' +
          '"¿Olvidaste tu contraseña?" o regístrate de nuevo tras publicar las reglas de Firestore.'
        );
      }
    } catch {
      // Protección contra enumeración de correos — mensaje genérico
    }

    return (
      'No se pudo iniciar sesión con este correo y contraseña. ' +
      'Si entraste antes con Google, usa ese botón. Si te registraste por correo ' +
      'y falló, publica firestore.rules.example y vuelve a registrarte.'
    );
  }

  return getErrorMessage({ code });
}

export async function sendRestaurantPasswordReset(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error('Ingresa un correo válido');
  }

  try {
    const methods = await fetchSignInMethodsForEmail(auth, normalized);
    if (methods.includes('google.com') && !methods.includes('password')) {
      throw new Error(
        'Este correo usa Google para iniciar sesión. Pulsa "Continuar con Google".'
      );
    }
    if (methods.length === 0) {
      throw new Error(
        'No hay cuenta con este correo. Regístrate primero en "Regístrate ahora".'
      );
    }
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes('Google') || err.message?.includes('Regístrate')) {
      throw error;
    }
    // Si fetchSignInMethods está bloqueado, intentar enviar igual
  }

  await sendPasswordResetEmail(auth, normalized);
}

/** Crea perfil restaurante en Firestore si el usuario entró con Google por primera vez */
async function ensureRestaurantProfile(fbUser: User): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USERS, fbUser.uid);
  let userSnap;

  try {
    userSnap = await getDoc(userRef);
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'permission-denied') {
      throw new Error(getFirestorePermissionMessage());
    }
    throw error;
  }

  if (userSnap.exists()) {
    const role = userSnap.data()?.role as string | undefined;
    if (role === 'customer') {
      await firebaseSignOut(auth);
      throw new Error(
        'Este correo de Google ya está registrado como cliente en la app QuickBite. ' +
          'Usa otro correo para el portal de restaurante, o pide al administrador ' +
          'que actualice tu usuario en Firestore (role: restaurant).'
      );
    }
    return;
  }

  const restId = fbUser.uid;
  const displayName =
    fbUser.displayName?.trim() || fbUser.email?.split('@')[0] || 'Mi Restaurante';

  const restaurantData = buildDefaultRestaurantData(restId, displayName);

  const userData = {
    uid: fbUser.uid,
    name: displayName,
    email: (fbUser.email ?? '').toLowerCase(),
    phone: '',
    photoURL: fbUser.photoURL ?? '',
    role: 'restaurant' as const,
    restaurantId: restId,
    darkMode: false,
    createdAt: serverTimestamp(),
  };

  try {
    // Primero users, luego restaurants (algunas reglas exigen usuario antes)
    await setDoc(userRef, userData);
    await setDoc(doc(db, COLLECTIONS.RESTAURANTS, restId), restaurantData);
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'permission-denied') {
      throw new Error(getFirestorePermissionMessage());
    }
    throw error;
  }
}

export async function registerRestaurant(
  input: RegisterRestaurantInput
): Promise<{ user: AppUser; restaurant: Restaurant }> {
  let fbUser: User | null = null;
  const email = normalizeEmail(input.email);

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      input.password
    );
    fbUser = credential.user;
    const displayName = input.name.trim();
    await updateProfile(fbUser, { displayName });

    const restId = fbUser.uid;
    const restaurantData = buildDefaultRestaurantData(
      restId,
      input.restaurantName.trim(),
      input.address?.trim() ?? ''
    );

    const userData = {
      uid: fbUser.uid,
      name: displayName,
      email,
      phone: input.phone?.trim() ?? '',
      photoURL: '',
      role: 'restaurant' as const,
      restaurantId: restId,
      darkMode: false,
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, COLLECTIONS.USERS, fbUser.uid), userData);
      await setDoc(doc(db, COLLECTIONS.RESTAURANTS, restId), restaurantData);
      await verifyRestaurantDocuments(fbUser.uid, restId);
    } catch (firestoreError) {
      await rollbackFailedRegistration(fbUser);
      const err = firestoreError as { code?: string; message?: string };
      if (
        err.code === 'permission-denied' ||
        /insufficient permissions/i.test(err.message ?? '')
      ) {
        throw new Error(
          getFirestorePermissionMessage() +
            ' La cuenta no quedó creada. Si al iniciar sesión ves ' +
            '"correo o contraseña incorrectos", regístrate de nuevo después de publicar las reglas.'
        );
      }
      throw firestoreError;
    }

    return {
      user: mapUser(fbUser.uid, userData, email),
      restaurant: mapRestaurant(restId, restaurantData),
    };
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}

export async function loginRestaurant(
  email: string,
  password: string
): Promise<{ user: AppUser; restaurant: Restaurant | null }> {
  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      normalizeEmail(email),
      password
    );
    return loadSession(credential.user);
  } catch (error: unknown) {
    const err = error as { code?: string };
    throw new Error(await resolveLoginError(email, err.code));
  }
}

/** Inicio de sesión con Google (web: popup de Firebase) */
export async function loginWithGoogle(): Promise<{
  user: AppUser;
  restaurant: Restaurant | null;
}> {
  if (Platform.OS !== 'web') {
    throw new Error(
      'En móvil usa el botón de Google; se abrirá el navegador de autenticación.'
    );
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    await ensureRestaurantProfile(result.user);
    return loadSession(result.user);
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}

/** Inicio de sesión con Google usando idToken (móvil / Expo Auth Session) */
export async function loginWithGoogleIdToken(
  idToken: string
): Promise<{ user: AppUser; restaurant: Restaurant | null }> {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    await ensureRestaurantProfile(result.user);
    return loadSession(result.user);
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error));
  }
}

/** Carga users/{uid} y restaurants/{restaurantId} */
export async function loadSession(
  fbUser: User
): Promise<{ user: AppUser; restaurant: Restaurant | null }> {
  let userSnap;
  try {
    userSnap = await getDoc(doc(db, COLLECTIONS.USERS, fbUser.uid));
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'permission-denied') {
      throw new Error(getAuthErrorMessage('permission-denied'));
    }
    throw error;
  }

  // El portal ya NO auto-crea perfiles (se quitó el registro): los usuarios de
  // restaurante los provisiona el administrador en Firestore. Si falta el
  // perfil, se informa con claridad en lugar de intentar crearlo (lo cual las
  // reglas bloquean por diseño).
  if (!userSnap.exists()) {
    await firebaseSignOut(auth);
    throw new Error(
      'Tu cuenta existe en Firebase Auth pero aún no tiene perfil de restaurante en ' +
        'Firestore. El administrador debe crear users/{uid} (role: "restaurant", ' +
        'restaurantId) y restaurants/{restaurantId} desde la consola de Firebase. ' +
        'NO publiques firestore.rules.example: sobrescribiría las reglas de la app móvil.'
    );
  }

  const user = mapUser(fbUser.uid, userSnap.data(), fbUser.email ?? '');

  if (user.role !== 'restaurant') {
    await firebaseSignOut(auth);
    throw new Error('Esta cuenta no es de restaurante. Usa el portal correcto.');
  }

  let restaurant: Restaurant | null = null;
  if (user.restaurantId) {
    const restSnap = await getDoc(
      doc(db, COLLECTIONS.RESTAURANTS, user.restaurantId)
    );
    if (restSnap.exists()) {
      restaurant = mapRestaurant(restSnap.id, restSnap.data());
    }
  }

  return { user, restaurant };
}

export async function logoutRestaurant(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<AppUser, 'name' | 'phone' | 'photoURL'>>
): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.USERS, uid), updates, { merge: true });
}

export async function updateRestaurantProfile(
  restId: string,
  updates: Partial<Restaurant>
): Promise<void> {
  const { id, ...rest } = updates;
  void id;
  await setDoc(doc(db, COLLECTIONS.RESTAURANTS, restId), rest, { merge: true });
}

export { mapRestaurant };
