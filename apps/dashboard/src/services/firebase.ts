/**
 * services/firebase.ts
 * Inicialización de Firebase (Auth, Firestore, Storage).
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig as userFirebaseConfig } from '../../firebase.config';

/** Detecta si el usuario aún no pegó credenciales reales */
export function isPlaceholderFirebaseConfig(
  cfg: typeof userFirebaseConfig
): boolean {
  const apiKey = (cfg.apiKey ?? '').trim();
  const appId = (cfg.appId ?? '').trim();
  const senderId = (cfg.messagingSenderId ?? '').trim();

  if (!apiKey || !appId || !senderId) return true;
  if (apiKey.includes('YOUR_') || apiKey.includes('...')) return true;
  if (appId.includes('YOUR_') || appId.includes('...')) return true;
  if (senderId === '123456789' || senderId.includes('...')) return true;
  if (apiKey.length < 30) return true;

  return false;
}

export const isFirebaseConfigured = !isPlaceholderFirebaseConfig(
  userFirebaseConfig
);

const firebaseConfig = userFirebaseConfig;

if (!isFirebaseConfigured && __DEV__) {
  console.warn(
    '[QuickBite] Abre firebase.config.ts en la raíz y pega tu apiKey, messagingSenderId y appId reales.'
  );
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app, firebaseConfig };
