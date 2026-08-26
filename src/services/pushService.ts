/**
 * services/pushService.ts
 * Registro del token de Expo Push del repartidor en users/{uid}.pushToken, para
 * que la Cloud Function le avise de nuevos pedidos disponibles.
 */
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '../utils/constants';

/**
 * Pide permiso, obtiene el token Expo y lo guarda en el perfil. Devuelve el
 * token, o null si no se otorgó el permiso o no se pudo obtener.
 */
export async function registerPushToken(uid: string): Promise<string | null> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  try {
    const token = (
      await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      )
    ).data;
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), { pushToken: token });
    return token;
  } catch {
    // Sin projectId (build sin EAS) u otro error: se ignora silenciosamente.
    return null;
  }
}

/** Limpia el token al cerrar sesión (deja de recibir push). */
export async function clearPushToken(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), { pushToken: '' });
  } catch {
    // best-effort
  }
}
