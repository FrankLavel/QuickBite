import { Pressable, StyleSheet, Text, View } from 'react-native';

import { QuickBiteColors } from '@/constants/quickbite';

export type AuthMode = 'sign-in' | 'sign-up';

type AuthTabSwitcherProps = {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
};

export function AuthTabSwitcher({ mode, onChange }: AuthTabSwitcherProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange('sign-in')}
        style={[styles.tab, mode === 'sign-in' ? styles.tabActive : null]}>
        <Text style={[styles.tabText, mode === 'sign-in' ? styles.tabTextActive : null]}>
          Sign In
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange('sign-up')}
        style={[styles.tab, mode === 'sign-up' ? styles.tabActive : null]}>
        <Text style={[styles.tabText, mode === 'sign-up' ? styles.tabTextActive : null]}>
          Create Account
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: QuickBiteColors.background,
    borderRadius: 999,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: QuickBiteColors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: QuickBiteColors.textSecondary,
  },
  tabTextActive: {
    color: QuickBiteColors.primary,
  },
});
