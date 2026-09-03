import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Config de Firebase: se lee de las variables EXPO_PUBLIC_* (.env) y, si alguna
// está vacía o ausente, cae al valor por defecto del proyecto (así la app sigue
// funcionando sin .env). Las llaves web de Firebase son públicas por diseño: la
// seguridad la dan las Security Rules, no el secreto de estas llaves.
const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyBilZAqSE2CGeAEMuabVtvK6YYRrsLD0n4',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'quickbite-6dee7.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'quickbite-6dee7',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'quickbite-6dee7',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '373417616626',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    '1:373417616626:web:92364e6b15af6133aa9c6b',
  measurementId:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-35YYK2RQG5',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// initializeAuth solo puede llamarse una vez por app. Tras un Fast Refresh la
// instancia ya existe, así que en ese caso reusamos la actual con getAuth.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
// Cloud Functions (región por defecto us-central1, donde se despliegan).
export const functions = getFunctions(app);
