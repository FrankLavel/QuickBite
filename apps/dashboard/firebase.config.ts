/**
 * firebase.config.ts
 * Configuración web del proyecto quickbite-6dee7 (Firebase Console).
 *
 * Las llaves web de Firebase son PÚBLICAS por diseño (la seguridad la dan las
 * Security Rules, no el secreto de estas llaves), igual que en la app cliente.
 * Por eso este archivo se versiona: así el typecheck y el build funcionan en CI
 * sin depender de un archivo local (F5).
 */

export const firebaseConfig = {
  apiKey: 'AIzaSyBilZAqSE2CGeAEMuabVtvK6YYRrsLD0n4',
  authDomain: 'quickbite-6dee7.firebaseapp.com',
  projectId: 'quickbite-6dee7',
  storageBucket: 'quickbite-6dee7',
  messagingSenderId: '373417616626',
  appId: '1:373417616626:web:92364e6b15af6133aa9c6b',
  measurementId: 'G-35YYK2RQG5',
};

/**
 * OAuth Web Client ID (Google Cloud / Firebase Auth → Google → Web SDK).
 * Placeholder: reemplázalo por el real para habilitar Google Sign-In.
 * Formato: 373417616626-xxxxxxxx.apps.googleusercontent.com
 */
export const googleWebClientId = '373417616626-xxxxxxxx.apps.googleusercontent.com';
