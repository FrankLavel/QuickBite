import { MaterialIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { palette } from '@/constants/colors';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

/** Wrapper sobre MaterialIcons con el color por defecto del sistema de diseño. */
export function Icon({ name, size = 24, color = palette.onSurfaceVariant }: IconProps) {
  return <MaterialIcons name={name} size={size} color={color} />;
}
