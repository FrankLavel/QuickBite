import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';

interface Banner {
  title: string;
  body: string;
  orderId?: string;
}

const AUTO_DISMISS_MS = 4500;

/**
 * Banner in-app que se muestra cuando llega una notificación push con la app
 * en primer plano. Reemplaza al banner nativo del sistema (suprimido en
 * lib/notifications.ts para foreground). Se desliza desde arriba, es tocable
 * para abrir el pedido, y se auto-oculta a los pocos segundos.
 */
export function ForegroundNotificationBanner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [banner, setBanner] = useState<Banner | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const data = content.data as { orderId?: string };
      setBanner({
        title: content.title ?? '',
        body: content.body ?? '',
        orderId: data?.orderId,
      });
      clearTimer();
      timer.current = setTimeout(() => setBanner(null), AUTO_DISMISS_MS);
    });
    return () => {
      sub.remove();
      clearTimer();
    };
  }, []);

  const handlePress = () => {
    clearTimer();
    const target = banner?.orderId ? `/tracking?orderId=${banner.orderId}` : '/notifications';
    setBanner(null);
    router.push(target);
  };

  if (!banner) return null;

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(18)}
      exiting={SlideOutUp.duration(250)}
      style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, zIndex: 1000 }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        className="bg-surface-container-lowest rounded-2xl p-4 flex-row items-center gap-3"
        style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}
      >
        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
          <Icon name="notifications" color={palette.primary} size={20} />
        </View>
        <View className="flex-1">
          {!!banner.title && (
            <Text className="text-on-surface font-bold text-sm" numberOfLines={1}>
              {banner.title}
            </Text>
          )}
          {!!banner.body && (
            <Text className="text-on-surface-variant text-xs" numberOfLines={2}>
              {banner.body}
            </Text>
          )}
        </View>
        <Icon name="chevron-right" color={palette.outline} size={20} />
      </TouchableOpacity>
    </Animated.View>
  );
}
