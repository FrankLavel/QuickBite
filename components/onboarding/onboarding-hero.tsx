import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { OnboardingBadge } from '@/constants/onboarding';
import { QuickBiteColors } from '@/constants/quickbite';

type OnboardingHeroProps = {
  image: string;
  badges: OnboardingBadge[];
};

const BADGE_POSITIONS: Record<OnboardingBadge['position'], object> = {
  'top-right': { top: 12, right: -8 },
  'bottom-left': { bottom: 12, left: -8 },
  'top-left': { top: 12, left: -8 },
  'bottom-right': { bottom: 12, right: -8 },
};

export function OnboardingHero({ image, badges }: OnboardingHeroProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.imageRing}>
        <Image source={{ uri: image }} style={styles.image} contentFit="cover" />
      </View>

      {badges.map((badge) => (
        <View
          key={`${badge.icon}-${badge.position}`}
          style={[styles.badge, BADGE_POSITIONS[badge.position]]}>
          <Ionicons name={badge.icon} size={20} color={badge.iconColor} />
        </View>
      ))}
    </View>
  );
}

const HERO_SIZE = 280;

const styles = StyleSheet.create({
  wrapper: {
    width: HERO_SIZE + 40,
    height: HERO_SIZE + 40,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRing: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: HERO_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: QuickBiteColors.white,
    borderWidth: 4,
    borderColor: QuickBiteColors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: QuickBiteColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
