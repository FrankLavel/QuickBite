import { View, Text, TouchableOpacity } from 'react-native';
import { Order } from '@/types/order.types';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderCardProps {
  order: Order;
  restaurantName?: string;
  onPress: () => void;
}

export function OrderCard({ order, restaurantName, onPress }: OrderCardProps) {
  return (
    <TouchableOpacity onPress={onPress} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm mb-3">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="font-semibold text-base">{restaurantName ?? 'Pedido'}</Text>
        <OrderStatusBadge status={order.status} />
      </View>
      <Text className="text-gray-500 text-sm">
        {order.items.length} artículos · ${order.total.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
}
