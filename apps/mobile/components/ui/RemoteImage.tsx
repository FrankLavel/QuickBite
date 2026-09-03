import { Image, View } from 'react-native';
import { Icon, IconName } from './Icon';
import { palette } from '@/constants/colors';

interface Props {
  /** URL de la imagen. Si está vacía/indefinida se muestra un placeholder. */
  uri?: string;
  className?: string;
  resizeMode?: 'cover' | 'contain' | 'center';
  fallbackIcon?: IconName;
  fallbackIconSize?: number;
}

/**
 * Imagen remota con placeholder cuando no hay URL. Evita el warning
 * "source.uri should not be an empty string" y da una imagen de respaldo
 * cuando el catálogo (creado desde el dashboard) no trae foto.
 */
export function RemoteImage({
  uri,
  className,
  resizeMode = 'cover',
  fallbackIcon = 'image',
  fallbackIconSize = 32,
}: Props) {
  if (uri && uri.trim()) {
    return <Image source={{ uri }} className={className} resizeMode={resizeMode} />;
  }
  return (
    <View className={`${className ?? ''} bg-surface-container items-center justify-center`}>
      <Icon name={fallbackIcon} color={palette.outline} size={fallbackIconSize} />
    </View>
  );
}
