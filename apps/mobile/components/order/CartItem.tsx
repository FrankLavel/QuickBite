import { View, Text, TouchableOpacity } from 'react-native';
import { CartItemType } from '@/types/order.types';

interface CartItemProps {
  item: CartItemType;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function CartItem({ item, onIncrement, onDecrement }: CartItemProps) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <Text className="flex-1 text-base">{item.name}</Text>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity onPress={onDecrement} className="w-7 h-7 bg-gray-100 rounded-full items-center justify-center">
          <Text className="text-lg">−</Text>
        </TouchableOpacity>
        <Text className="text-base font-semibold">{item.quantity}</Text>
        <TouchableOpacity onPress={onIncrement} className="w-7 h-7 bg-primary rounded-full items-center justify-center">
          <Text className="text-white text-lg">+</Text>
        </TouchableOpacity>
      </View>
      <Text className="w-20 text-right font-semibold">${(item.price * item.quantity).toFixed(2)}</Text>
    </View>
  );
}
