import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { usersService } from '@/services/users.service';
import { Notification } from '@/types/notification.types';

const notifsCol = (uid: string) =>
  collection(db, 'users', uid, 'notifications');

export const notificationsService = {
  /**
   * Pide permiso, obtiene el Expo push token y lo guarda en el perfil.
   * Devuelve el token, o null si no se otorgó el permiso.
   */
  registerPushToken: async (uid: string): Promise<string | null> => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const token = (
      await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      )
    ).data;

    await usersService.setPushToken(uid, token);
    return token;
  },

  /** Historial de notificaciones del usuario, más reciente primero. */
  getNotifications: async (uid: string): Promise<Notification[]> => {
    const q = query(notifsCol(uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
  },

  /** Escucha en tiempo real las notificaciones del usuario. */
  listenNotifications: (
    uid: string,
    onChange: (items: Notification[]) => void
  ): Unsubscribe => {
    const q = query(notifsCol(uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) =>
      onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification)))
    );
  },

  /** El cliente solo puede marcar isRead = true. */
  markAsRead: (uid: string, notifId: string) =>
    updateDoc(doc(db, 'users', uid, 'notifications', notifId), { isRead: true }),

  /** Borra una notificación del historial del usuario. */
  deleteNotification: (uid: string, notifId: string) =>
    deleteDoc(doc(db, 'users', uid, 'notifications', notifId)),

  /** Borra todas las notificaciones del usuario. */
  deleteAllNotifications: async (uid: string): Promise<void> => {
    const snap = await getDocs(notifsCol(uid));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  },
};
