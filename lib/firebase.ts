import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBilZAqSE2CGeAEMuabVtvK6YYRrsLD0n4",
  authDomain: "quickbite-6dee7.firebaseapp.com",
  projectId: "quickbite-6dee7",
  storageBucket: "quickbite-6dee7.firebasestorage.app",
  messagingSenderId: "373417616626",
  appId: "1:373417616626:web:92364e6b15af6133aa9c6b",
  measurementId: "G-35YYK2RQG5"
};

function createFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  return initializeApp(firebaseConfig);
}

function createFirebaseAuth(app: FirebaseApp): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const firebaseApp = createFirebaseApp();
export const auth = createFirebaseAuth(firebaseApp);

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}
