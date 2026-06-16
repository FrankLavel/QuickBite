import { StyleSheet, View } from 'react-native';

import { QuickBiteColors } from '@/constants/quickbite';

type OnboardingPaginationProps = {
  total: number;
  activeIndex: number;
};

export function OnboardingPagination({ total, activeIndex }: OnboardingPaginationProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === activeIndex ? styles.dotActive : styles.dotInactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 999,
  },
  dotActive: {
    width: 28,
    height: 8,
    backgroundColor: QuickBiteColors.primary,
  },
  dotInactive: {
    width: 8,
    height: 8,
    backgroundColor: '#D1D5DB',
  },
});
