import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { QuickBiteColors } from '@/constants/quickbite';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { OnboardingProvider, useOnboarding } from '@/contexts/onboarding-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

function RootNavigator() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading: authLoading } = useAuth();
  const { isComplete: onboardingComplete, isLoading: onboardingLoading } = useOnboarding();

  const isLoading = authLoading || onboardingLoading;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const currentGroup = segments[0] as string | undefined;
    const inOnboarding = currentGroup === '(onboarding)';
    const inAuth = currentGroup === '(auth)';

    if (!onboardingComplete && !inOnboarding) {
      router.replace('/(onboarding)' as Href);
      return;
    }

    if (onboardingComplete && !user && !inAuth) {
      router.replace('/(auth)' as Href);
      return;
    }

    if (user && (inAuth || inOnboarding)) {
      router.replace('/(tabs)' as Href);
    }
  }, [user, isLoading, onboardingComplete, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={QuickBiteColors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </OnboardingProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: QuickBiteColors.white,
  },
});
