/**
 * services/firebase.ts
 * Inicialización de Firebase (Auth, Firestore). Comparte el proyecto
 * quickbite-6dee7 con la app cliente y el dashboard.
 *
 * Persistencia de la sesión: se inicializa Auth con AsyncStorage para que el
 * login sobreviva a cerrar la app por completo (al reabrir en frío ya no se pide
 * login). `getReactNativePersistence` sí existe en el SDK JS v12; vive en el
 * bundle de React Native, que Metro resuelve por la condición "react-native"
 * del paquete (Node no lo ve, pero el runtime de la app sí).
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, type Persistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../../firebase.config';

// `getReactNativePersistence` no está en los tipos del entry por defecto de
// 'firebase/auth' (solo en su bundle RN, que Metro resuelve en runtime), así que
// lo tomamos con un require tipado para satisfacer a TypeScript sin romper el
// resolver de Metro.
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence: (storage: unknown) => Persistence;
};

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// En el primer arranque inicializamos Auth con persistencia en AsyncStorage. En
// Fast Refresh el módulo se reutiliza y Auth ya está inicializado, así que
// caemos a getAuth (initializeAuth dos veces sobre la misma app lanza error).
export const auth = isFirstInit
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);

export const db = getFirestore(app);
export { app };
