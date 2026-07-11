import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from './Icon';
import { palette } from '@/constants/colors';
import { useTranslation } from '@/hooks/useTranslation';

interface ScreenHeaderProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showFavorite?: boolean;
  /** Si el corazón está activo (relleno). */
  favoriteActive?: boolean;
  showShare?: boolean;
  showNotifications?: boolean;
  /** Tiñe todos los íconos con el color primario (útil sobre el header del restaurante). */
  tintPrimary?: boolean;
  onBack?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
}

/** Equivalente al TopAppBar del prototipo: título + acciones (search / favorite / share / notifications). */
export function ScreenHeader({
  title = 'QuickBite',
  showBack = false,
  showSearch = true,
  showFavorite = false,
  favoriteActive = false,
  showShare = false,
  showNotifications = true,
  tintPrimary = false,
  onBack,
  onFavorite,
  onShare,
}: ScreenHeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const actionColor = tintPrimary ? palette.primary : undefined;

  return (
    <View className="flex-row items-center justify-between px-4 py-2 bg-background">
      <View className="flex-row items-center gap-1">
        {showBack && (
          <TouchableOpacity
            onPress={onBack ?? (() => router.back())}
            activeOpacity={0.7}
            className="p-2 rounded-full"
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Icon name="arrow-back" color={palette.primary} />
          </TouchableOpacity>
        )}
        <Text className="text-xl font-bold text-primary tracking-tight">{title}</Text>
      </View>

      <View className="flex-row items-center gap-1">
        {showSearch && (
          <TouchableOpacity
            activeOpacity={0.7}
            className="p-2 rounded-full"
            accessibilityRole="button"
            accessibilityLabel={t('a11y.search')}
          >
            <Icon name="search" color={actionColor} />
          </TouchableOpacity>
        )}
        {showFavorite && (
          <TouchableOpacity
            onPress={onFavorite}
            activeOpacity={0.7}
            className="p-2 rounded-full"
            accessibilityRole="button"
            accessibilityLabel={t(favoriteActive ? 'a11y.favoriteRemove' : 'a11y.favoriteAdd')}
          >
            <Icon
              name={favoriteActive ? 'favorite' : 'favorite-border'}
              color={favoriteActive ? palette.error : actionColor}
            />
          </TouchableOpacity>
        )}
        {showShare && (
          <TouchableOpacity
            onPress={onShare}
            activeOpacity={0.7}
            className="p-2 rounded-full"
            accessibilityRole="button"
            accessibilityLabel={t('a11y.share')}
          >
            <Icon name="share" color={actionColor} />
          </TouchableOpacity>
        )}
        {showNotifications && (
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
            className="p-2 rounded-full"
            accessibilityRole="button"
            accessibilityLabel={t('a11y.notifications')}
          >
            <Icon name="notifications" color={actionColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
