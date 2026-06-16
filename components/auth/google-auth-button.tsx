import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { QuickBiteColors } from '@/constants/quickbite';
import { useGoogleAuth } from '@/hooks/use-google-auth';

type GoogleAuthButtonProps = {
  disabled?: boolean;
};

export function GoogleAuthButton({ disabled }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, isReady } = useGoogleAuth(setIsLoading);

  const isDisabled = disabled || isLoading || !isReady;

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        onPress={signIn}
        style={[styles.googleButton, isDisabled ? styles.disabled : null]}>
        {isLoading ? (
          <ActivityIndicator color={QuickBiteColors.primary} />
        ) : (
          <>
            <Text style={styles.googleLogo}>G</Text>
            <Text style={styles.googleText}>Google</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: QuickBiteColors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: QuickBiteColors.textMuted,
  },
  googleButton: {
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: QuickBiteColors.white,
    borderWidth: 1,
    borderColor: QuickBiteColors.border,
  },
  disabled: {
    opacity: 0.6,
  },
  googleLogo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: QuickBiteColors.text,
  },
});
