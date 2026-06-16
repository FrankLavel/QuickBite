import { Image } from 'expo-image';
import { StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { QuickBiteColors, QuickBiteCopy } from '@/constants/quickbite';

type QuickBiteLogoProps = {
  size?: number;
  showName?: boolean;
  variant?: 'stacked' | 'horizontal';
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export function QuickBiteLogo({
  size = 48,
  showName = true,
  variant = 'stacked',
  style,
  imageStyle,
}: QuickBiteLogoProps) {
  const isHorizontal = variant === 'horizontal';

  return (
    <View style={[isHorizontal ? styles.horizontal : styles.stacked, style]}>
      <Image
        source={require('@/assets/images/logo-quickbite.png')}
        style={[{ width: size, height: size, borderRadius: size * 0.22 }, imageStyle]}
        contentFit="cover"
      />
      {showName ? (
        <Text
          style={[
            styles.name,
            isHorizontal ? styles.nameHorizontal : null,
            { fontSize: isHorizontal ? size * 0.625 : size * 0.58 },
          ]}>
          {QuickBiteCopy.appName}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stacked: {
    alignItems: 'center',
    gap: 12,
  },
  horizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontWeight: '800',
    color: QuickBiteColors.primary,
    letterSpacing: -0.5,
  },
  nameHorizontal: {
    marginTop: 0,
  },
});
