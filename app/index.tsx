import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { config } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';

const STATUS_KEYS = [
  'splash.status0',
  'splash.status1',
  'splash.status2',
  'splash.status3',
];

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [animationDone, setAnimationDone] = useState(false);
  const [status, setStatus] = useState(t('splash.preparing'));
  const pulse = useRef(new Animated.Value(1)).current;

  // Pulso sutil del logo.
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.02, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  // Barra de progreso + estados + navegación.
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + Math.random() * 15, 100);
        if (next < 25) setStatus(t(STATUS_KEYS[0]));
        else if (next < 50) setStatus(t(STATUS_KEYS[1]));
        else if (next < 75) setStatus(t(STATUS_KEYS[2]));
        else setStatus(t(STATUS_KEYS[3]));

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setStatus(t('splash.enjoy')), 500);
          setTimeout(() => setAnimationDone(true), 1000);
        }
        return next;
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Cuando termina la animación y se resolvió la sesión, decide el destino:
  // sesión persistida → tabs; si no → onboarding.
  useEffect(() => {
    if (animationDone && !loading) {
      router.replace(user ? '/(tabs)' : '/(auth)/onboarding');
    }
  }, [animationDone, loading, user, router]);

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[palette.primary, palette.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* Íconos decorativos flotantes */}
      <View className="absolute inset-0" pointerEvents="none">
        <View className="absolute top-[10%] left-[5%] opacity-20">
          <Icon name="local-pizza" color={palette.onPrimary} size={120} />
        </View>
        <View className="absolute bottom-[15%] right-[10%] opacity-20">
          <Icon name="lunch-dining" color={palette.onPrimary} size={140} />
        </View>
        <View className="absolute top-[20%] right-[15%] opacity-10">
          <Icon name="ramen-dining" color={palette.onPrimary} size={80} />
        </View>
      </View>

      {/* Contenido */}
      <View className="flex-1 items-center justify-center px-4">
        <Animated.View style={{ transform: [{ scale: pulse }] }} className="items-center mb-8">
          <View className="bg-on-primary p-4 rounded-full mb-4" style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}>
            <Icon name="restaurant" color={palette.primary} size={64} />
          </View>
          <Text className="text-4xl font-extrabold text-on-primary tracking-tight">
            {config.texts.appName}
          </Text>
        </Animated.View>

        <Text className="text-lg font-semibold text-on-primary/90 text-center max-w-[280px] mb-12">
          {t('splash.tagline')}
        </Text>

        {/* Barra de progreso */}
        <View className="w-64">
          <View className="h-1.5 w-full bg-on-primary/20 rounded-full overflow-hidden mb-2">
            <View className="h-full bg-on-primary rounded-full" style={{ width: `${progress}%` }} />
          </View>
          <Text className="text-xs text-on-primary/70 tracking-[2px] uppercase text-center">
            {status}
          </Text>
        </View>
      </View>
    </View>
  );
}
