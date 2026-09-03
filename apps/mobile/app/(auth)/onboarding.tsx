import { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { useTranslation } from '@/hooks/useTranslation';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB5bXSOpNzf7fss77kXqUpx9ttqb5namjovxnkReFZDkzydnqYaqpazLjuX4Dy1XsziiYiF_FCAKkM55221E6v-8Z2z5mfsFX1pHQ04SOe5DaAR_YC3VXJd5gVu_r-CbxjnJGtcq6OPeqw-1ZNN70njfK9r_dCsV3TZTmlsE3-H-Tcgk-hcEin4lRpJlmOt3F2yYtRuSA0mVCnAkzhurMcTD3kOMjYUDXL40nbZKz9hW-M-oBqEdtfL6rS-4LWRnadW_AMXlYPBLsPR';

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -10, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [float]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View style={{ transform: [{ translateY: float }] }} className="mb-12">
          <Image
            source={{ uri: HERO_IMAGE }}
            className="w-72 h-72 rounded-full border-4 border-white"
            style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }}
          />
        </Animated.View>

        <Text className="text-3xl font-bold leading-tight text-center mb-4 text-on-background">
          {t('onboarding.titlePrefix')}<Text className="text-primary">{t('onboarding.titleHighlight')}</Text>
        </Text>
        <Text className="text-secondary text-center leading-relaxed mb-12">
          {t('onboarding.subtitle')}
        </Text>
      </View>

      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.9}
          className="h-14 bg-primary rounded-full flex-row items-center justify-center gap-2"
        >
          <Text className="text-white font-bold text-base">{t('auth.continue')}</Text>
          <Icon name="arrow-forward" color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
