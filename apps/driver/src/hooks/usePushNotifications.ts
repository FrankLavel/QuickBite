/**
 * hooks/usePushNotifications.ts
 * Configura push del repartidor: canal Android, registro del token Expo cuando
 * hay sesión, y navegación al tocar una notificación.
 */
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { registerPushToken } from '../services/pushService';
import { setupAndroidChannel } from '../utils/notifications';
import { navigationRef } from '../navigation/navigationRef';

export function usePushNotifications() {
  const { driver } = useAuth();

  useEffect(() => {
    setupAndroidChannel();
  }, []);

  useEffect(() => {
    if (!driver) return;
    registerPushToken(driver.uid).catch(() => undefined);
  }, [driver?.uid]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (!navigationRef.isReady()) return;
        const data = response.notification.request.content.data as {
          orderId?: string;
        };
        if (data?.orderId) {
          navigationRef.navigate('OrderDetail', { orderId: data.orderId });
        } else {
          navigationRef.navigate('Tabs', { screen: 'Available' });
        }
      }
    );
    return () => sub.remove();
  }, []);
}
