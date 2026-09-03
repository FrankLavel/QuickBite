import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Restaurant } from '@/types/restaurant.types';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
}

export function RestaurantCard({
  restaurant,
  onPress,
  favorite = false,
  onToggleFavorite,
}: RestaurantCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="bg-surface-container-lowest rounded-2xl overflow-hidden mb-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
    >
      <View className="h-48 relative">
        <Image source={{ uri: restaurant.coverImage }} className="w-full h-full" resizeMode="cover" />
        <TouchableOpacity
          onPress={onToggleFavorite}
          className="absolute top-3 right-3 w-10 h-10 bg-white/90 rounded-full items-center justify-center"
        >
          <Icon
            name={favorite ? 'favorite' : 'favorite-border'}
            color={favorite ? palette.error : palette.primary}
            size={20}
          />
        </TouchableOpacity>
      </View>

      <View className="p-4">
        <View className="flex-row justify-between items-start mb-1">
          <Text className="font-bold text-lg text-on-surface flex-1 pr-2">{restaurant.name}</Text>
          <View className="flex-row items-center gap-1">
            <Icon name="star" color={palette.star} size={16} />
            <Text className="text-xs font-bold text-on-surface">{restaurant.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text className="text-secondary text-sm mb-3">{restaurant.cuisineTypes.join(' • ')}</Text>
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Icon name="schedule" color={palette.secondary} size={15} />
            <Text className="text-xs text-secondary">{restaurant.deliveryTime}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Icon name="payments" color={palette.secondary} size={15} />
            <Text className="text-xs text-secondary">
              {restaurant.deliveryFee === 0 ? 'Free Delivery' : `$${restaurant.deliveryFee.toFixed(2)}`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
