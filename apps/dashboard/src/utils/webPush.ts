/**
 * utils/webPush.ts
 * Suscripción a Web Push del dashboard (PWA) para que el restaurante reciba
 * avisos de pedidos nuevos aunque tenga la pestaña cerrada. Solo corre en web:
 * usa el service worker (public/sw.js) y guarda la suscripción en el perfil.
 */
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { COLLECTIONS } from './constants';

// Llave PÚBLICA VAPID (segura de exponer; la privada vive en las Cloud Functions).
const VAPID_PUBLIC_KEY =
  'BMrxZMPOZPULBeQ3yD2QLCvoJ9jkQNpE1B5RqbmTYajFmWp5DNjjGevIMI4-MuDlZyOYrQPnEMifyfZLYW8I7xY';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
  return arr;
}

/**
 * Pide permiso, se suscribe con el service worker y guarda la suscripción en
 * users/{uid}.webPushSubscription. No-op fuera de web o si no hay soporte/permiso.
 */
export async function subscribeWebPush(uid: string): Promise<void> {
  if (Platform.OS !== 'web') return;
  if (
    typeof window === 'undefined' ||
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      webPushSubscription: sub.toJSON(),
    });
  } catch {
    // permiso denegado, sin soporte o error de red: se ignora silenciosamente.
  }
}
