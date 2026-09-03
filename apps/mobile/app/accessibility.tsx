import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useA11yStore } from '@/store/a11yStore';
import { useTranslation } from '@/hooks/useTranslation';

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 4 },
};

function RowIcon({ icon }: { icon: IconName }) {
  return (
    <View className="p-2 bg-secondary-container rounded-lg">
      <Icon name={icon} color={palette.onSecondaryContainer} />
    </View>
  );
}

export default function AccessibilityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const highContrast = useA11yStore((s) => s.highContrast);
  const largeText = useA11yStore((s) => s.largeText);
  const setHighContrast = useA11yStore((s) => s.setHighContrast);
  const setLargeText = useA11yStore((s) => s.setLargeText);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Top App Bar */}
      <View className="flex-row items-center gap-2 px-4 py-2 bg-background">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="p-2 rounded-full"
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Icon name="arrow-back" color={palette.primary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-on-surface">{t('a11y.title')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-4 py-6 gap-4">
        <Text className="text-sm text-on-surface-variant px-1">{t('a11y.intro')}</Text>

        <View className="bg-surface-container-lowest rounded-xl overflow-hidden" style={cardShadow}>
          {/* Alto contraste */}
          <View
            className="flex-row items-center justify-between p-4"
            accessibilityRole="switch"
            accessibilityLabel={t('a11y.highContrast')}
            accessibilityHint={t('a11y.highContrastDesc')}
            accessibilityState={{ checked: highContrast }}
          >
            <View className="flex-row items-center gap-4 flex-1 pr-3">
              <RowIcon icon="contrast" />
              <View className="flex-1">
                <Text className="text-base text-on-surface">{t('a11y.highContrast')}</Text>
                <Text className="text-xs text-on-surface-variant">{t('a11y.highContrastDesc')}</Text>
              </View>
            </View>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{ true: palette.primary, false: palette.outlineVariant }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Texto más grande */}
          <View
            className="flex-row items-center justify-between p-4 border-t border-surface-variant"
            accessibilityRole="switch"
            accessibilityLabel={t('a11y.largeText')}
            accessibilityHint={t('a11y.largeTextDesc')}
            accessibilityState={{ checked: largeText }}
          >
            <View className="flex-row items-center gap-4 flex-1 pr-3">
              <RowIcon icon="format-size" />
              <View className="flex-1">
                <Text className="text-base text-on-surface">{t('a11y.largeText')}</Text>
                <Text className="text-xs text-on-surface-variant">{t('a11y.largeTextDesc')}</Text>
              </View>
            </View>
            <Switch
              value={largeText}
              onValueChange={setLargeText}
              trackColor={{ true: palette.primary, false: palette.outlineVariant }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
