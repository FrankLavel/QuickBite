import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color = 'bg-primary' }: BadgeProps) {
  return (
    <View className={`${color} rounded-full px-3 py-1`}>
      <Text className="text-white text-xs font-semibold">{label}</Text>
    </View>
  );
}
