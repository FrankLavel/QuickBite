import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingHeader } from '@/components/onboarding/onboarding-header';
import { OnboardingHero } from '@/components/onboarding/onboarding-hero';
import { OnboardingPagination } from '@/components/onboarding/onboarding-pagination';
import { ONBOARDING_SLIDES, type OnboardingSlide } from '@/constants/onboarding';
import { QuickBiteColors } from '@/constants/quickbite';
import { useOnboarding } from '@/contexts/onboarding-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === ONBOARDING_SLIDES.length - 1;

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const handleContinue = async () => {
    if (isLastSlide) {
      await completeOnboarding();
      return;
    }

    listRef.current?.scrollToIndex({
      index: activeIndex + 1,
      animated: true,
    });
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(nextIndex);
  };

  const renderSlide = ({ item }: ListRenderItemInfo<OnboardingSlide>) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <OnboardingHero image={item.image} badges={item.badges} />

      <View style={styles.copyBlock}>
        <Text style={styles.title}>
          {item.title}{' '}
          <Text style={styles.titleHighlight}>{item.titleHighlight}</Text>
        </Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <OnboardingHeader onSkip={handleSkip} />
      </View>

      <FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <OnboardingPagination total={ONBOARDING_SLIDES.length} activeIndex={activeIndex} />

        <Pressable accessibilityRole="button" onPress={handleContinue} style={styles.continueButton}>
          <Text style={styles.continueText}>Continue</Text>
          <Text style={styles.continueArrow}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QuickBiteColors.white,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    alignItems: 'center',
  },
  slide: {
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 32,
  },
  copyBlock: {
    gap: 14,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: QuickBiteColors.text,
    letterSpacing: -0.5,
  },
  titleHighlight: {
    color: QuickBiteColors.primary,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: QuickBiteColors.textSecondary,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 28,
    marginTop: 8,
  },
  continueButton: {
    backgroundColor: QuickBiteColors.primary,
    borderRadius: 999,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueText: {
    color: QuickBiteColors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  continueArrow: {
    color: QuickBiteColors.white,
    fontSize: 18,
    fontWeight: '400',
    marginTop: -1,
  },
});
