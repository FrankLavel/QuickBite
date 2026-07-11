import { View, Text } from 'react-native';
import { OrderStatus } from '@/types/order.types';
import { ORDER_STATUS_COLOR } from '@/lib/orderStatus';
import { useTranslation } from '@/hooks/useTranslation';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const color = ORDER_STATUS_COLOR[status];
  return (
    <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${color}20` }}>
      <Text className="text-xs font-bold" style={{ color }}>
        {t(`statusLabel.${status}`)}
      </Text>
    </View>
  );
}
