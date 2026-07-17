import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icon, IconName } from '@/components/ui/Icon';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { palette } from '@/constants/colors';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from '@/hooks/useTranslation';
import { Notification, NotificationType } from '@/types/notification.types';

const FILTERS = ['All', 'Orders', 'Promos', 'System'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_TYPE: Record<Exclude<Filter, 'All'>, NotificationType> = {
  Orders: 'order_update',
  Promos: 'promo',
  System: 'system',
};

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 4 },
};

interface Badge {
  icon: IconName;
  bg: string;
  color: string;
}

function badgeFor(type: NotificationType): Badge {
  switch (type) {
    case 'order_update':
      return { icon: 'local-shipping', bg: 'bg-primary-container', color: palette.onPrimaryContainer };
    case 'promo':
      return { icon: 'confirmation-number', bg: 'bg-secondary-container', color: palette.primary };
    case 'system':
      return { icon: 'info', bg: 'bg-surface-container', color: palette.onSurfaceVariant };
  }
}

/** Fondo rojo con ícono de basura que se revela al deslizar la tarjeta. */
function SwipeDeleteAction({ align }: { align: 'left' | 'right' }) {
  return (
    <View
      className={`bg-error rounded-xl justify-center ${
        align === 'right' ? 'items-end pr-6' : 'items-start pl-6'
      }`}
      style={{ flex: 1 }}
    >
      <Icon name="delete" color="#ffffff" size={24} />
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('All');
  const [confirmClear, setConfirmClear] = useState(false);
  const { notifications, loading, markAsRead, remove, clearAll } =
    useNotifications();
  const { t, lang } = useTranslation();

  const filtered =
    filter === 'All'
      ? notifications
      : notifications.filter((n) => n.type === FILTER_TYPE[filter]);

  const unread = filtered.filter((n) => !n.isRead);
  const read = filtered.filter((n) => n.isRead);

  const renderCard = (n: Notification) => {
    const badge = badgeFor(n.type);
    const time = n.createdAt
      ? formatDistanceToNow(n.createdAt.toDate(), {
          addSuffix: true,
          locale: lang === 'es' ? es : undefined,
        })
      : '';
    return (
      <Swipeable
        key={n.id}
        renderRightActions={() => <SwipeDeleteAction align="right" />}
        renderLeftActions={() => <SwipeDeleteAction align="left" />}
        onSwipeableOpen={() => remove(n.id)}
        overshootLeft={false}
        overshootRight={false}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => !n.isRead && markAsRead(n.id)}
          className="bg-surface-container-lowest rounded-xl p-4 flex-row gap-4 relative overflow-hidden"
          style={[cardShadow, n.isRead ? { opacity: 0.8 } : null]}
        >
        {!n.isRead && <View className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
        <View className={`w-12 h-12 rounded-full items-center justify-center ${badge.bg}`}>
          <Icon name={badge.icon} color={badge.color} />
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <Text className="text-lg font-bold text-on-surface flex-1 pr-2">{n.title}</Text>
            <Text className="text-xs text-secondary">{time}</Text>
          </View>
          <Text className="text-sm text-on-surface-variant mt-1">{n.body}</Text>
          {n.type === 'order_update' && n.orderId && (
            <View className="mt-4 flex-row gap-2">
              <TouchableOpacity
                onPress={() => router.push(`/tracking?orderId=${n.orderId}`)}
                className="bg-primary px-6 py-2 rounded-full"
              >
                <Text className="text-on-primary text-sm font-bold">{t('notifications.trackOrder')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Top AppBar */}
      <View className="flex-row justify-between items-center px-4 py-2 bg-background">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="p-2 rounded-full"
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Icon name="arrow-back" color={palette.primary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-primary">{t('notifications.title')}</Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity
            onPress={() => setConfirmClear(true)}
            activeOpacity={0.7}
            className="flex-row items-center gap-1 px-3 py-2 rounded-full"
            accessibilityRole="button"
            accessibilityLabel={t('notifications.clearAll')}
          >
            <Icon name="delete" color={palette.error} size={20} />
            <Text className="text-error text-sm font-bold">
              {t('notifications.clearAll')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="px-4 pt-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {FILTERS.map((f) => {
            const isOn = filter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                className="px-6 py-1 rounded-full"
                style={{ backgroundColor: isOn ? palette.primary : palette.surfaceContainer }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: isOn ? palette.onPrimary : palette.onSurfaceVariant }}
                >
                  {t(`notifications.${f.toLowerCase()}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 gap-2">
          <Icon name="notifications-none" size={48} color={palette.outline} />
          <Text className="text-on-surface-variant text-center">{t('notifications.empty')}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-4 py-6 gap-6">
          {unread.length > 0 && (
            <View className="gap-4">
              <Text className="text-sm font-semibold text-secondary">{t('notifications.new')}</Text>
              {unread.map(renderCard)}
            </View>
          )}
          {read.length > 0 && (
            <View className="gap-4">
              <Text className="text-sm font-semibold text-secondary">{t('notifications.earlier')}</Text>
              {read.map(renderCard)}
            </View>
          )}
        </ScrollView>
      )}

      <ConfirmDialog
        visible={confirmClear}
        title={t('notifications.clearTitle')}
        message={t('notifications.clearMsg')}
        confirmLabel={t('notifications.clearAll')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          setConfirmClear(false);
          clearAll();
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </SafeAreaView>
  );
}
