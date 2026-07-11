import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBilZAqSE2CGeAEMuabVtvK6YYRrsLD0n4",
  authDomain: "quickbite-6dee7.firebaseapp.com",
  projectId: "quickbite-6dee7",
  storageBucket: "quickbite-6dee7",
  messagingSenderId: "373417616626",
  appId: "1:373417616626:web:92364e6b15af6133aa9c6b",
  measurementId: "G-35YYK2RQG5"
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
