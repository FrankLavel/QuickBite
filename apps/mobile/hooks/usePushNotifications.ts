import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useNotifStore } from '@/store/notifStore';
import { notificationsService } from '@/services/notifications.service';
import { usersService } from '@/services/users.service';
import { setupAndroidChannel } from '@/lib/notifications';

/**
 * Configura push: canal Android, registro del token Expo (cuando hay sesión) y
 * navegación al tocar una notificación. Se monta una vez en el root layout.
 */
export function usePushNotifications() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const notifEnabled = useNotifStore((s) => s.enabled);

  // Canal de Android (una sola vez).
  useEffect(() => {
    setupAndroidChannel();
  }, []);

  // Sincroniza el token Expo con la preferencia del usuario: si están activadas
  // registra/guarda el token; si no, lo limpia para que la Cloud Function no
  // envíe push (respeta el switch de Settings incluso tras reiniciar la app).
  useEffect(() => {
    if (!user) return;
    if (notifEnabled) {
      notificationsService.registerPushToken(user.uid).catch(() => {
        // permiso denegado o sin projectId: se ignora silenciosamente
      });
    } else {
      usersService.setPushToken(user.uid, '').catch(() => {});
    }
  }, [user?.uid, notifEnabled]);

  // Al tocar una notificación: abre el seguimiento del pedido si trae orderId.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { orderId?: string };
      if (data?.orderId) {
        router.push(`/tracking?orderId=${data.orderId}`);
      } else {
        router.push('/notifications');
      }
    });
    return () => sub.remove();
  }, [router]);
}
