import { Pressable, StyleSheet, Text, View } from 'react-native';

import { QuickBiteLogo } from '@/components/quickbite-logo';
import { QuickBiteColors } from '@/constants/quickbite';

type OnboardingHeaderProps = {
  onSkip: () => void;
};

export function OnboardingHeader({ onSkip }: OnboardingHeaderProps) {
  return (
    <View style={styles.container}>
      <QuickBiteLogo size={32} variant="horizontal" />

      <Pressable accessibilityRole="button" hitSlop={12} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    color: QuickBiteColors.textMuted,
  },
});
