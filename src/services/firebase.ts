/**
 * services/firebase.ts
 * Inicialización de Firebase (Auth, Firestore). Comparte el proyecto
 * quickbite-6dee7 con la app cliente y el dashboard.
 *
 * Nota sobre persistencia: firebase JS SDK v12 removió `getReactNativePersistence`
 * y no expone una persistencia para React Native, por lo que la sesión de Auth
 * queda en memoria: sobrevive a Fast Refresh, pero NO a cerrar la app por completo
 * (al reabrir en frío se pide login de nuevo). Es una limitación conocida del SDK
 * JS en RN; se resolverá en v2 (SDK nativo o un shim de persistencia).
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../../firebase.config';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };
