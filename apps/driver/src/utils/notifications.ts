/**
 * utils/notifications.ts
 * Configuración base de notificaciones: comportamiento en primer plano y canal
 * de Android (requerido para mostrarlas).
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// En primer plano mostramos el banner nativo (la app no tiene banner propio).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Crea el canal de Android 'default' (necesario para push en Android). */
export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Pedidos disponibles',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2caf4b',
  });
}
