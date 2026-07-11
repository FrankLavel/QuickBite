import { useState, useEffect } from 'react';
import { Notification } from '@/types/notification.types';
import { notificationsService } from '@/services/notifications.service';
import { useAuthStore } from '@/store/authStore';

/** Notificaciones del usuario en tiempo real. */
export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const unsub = notificationsService.listenNotifications(user.uid, (items) => {
      setNotifications(items);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const markAsRead = (id: string) => {
    if (user) notificationsService.markAsRead(user.uid, id);
  };

  return { notifications, loading, markAsRead };
}
