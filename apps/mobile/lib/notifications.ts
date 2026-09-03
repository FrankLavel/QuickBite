import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Con la app en primer plano NO mostramos el banner nativo: lo reemplaza el
// banner propio y estilizado (components/notifications/ForegroundNotificationBanner).
// handleNotification solo corre en foreground; las notificaciones en segundo
// plano las presenta el SO normalmente (bandeja + banner).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Crea el canal de notificaciones de Android (requerido para mostrarlas). */
export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#006e2f',
  });
}
