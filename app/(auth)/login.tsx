import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { statusCodes } from '@react-native-google-signin/google-signin';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { signIn, signUp, signInWithGoogle, resetPassword } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { errorCode } from '@/lib/errors';

/** Devuelve la clave i18n del error común de Firebase Auth. */
function authErrorKey(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'auth.errInvalidEmail';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'auth.errInvalidCred';
    case 'auth/email-already-in-use':
      return 'auth.errEmailInUse';
    case 'auth/weak-password':
      return 'auth.errWeakPass';
    default:
      return 'auth.errGeneric';
  }
}

const BG_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBN1AwkqDIC5ZC4tIuSWPM5Fm_euTETOs9KJpEE0Y7j7pRbMtfgyxEcrDBOmmuJGb5begwCllyIiS4HHMmchWrfvwkl7R_qLfA37knKYo_YxB2jLnAK6kgygoKgbKaDUeqwuoD8oAdpHkuWDtcFXfn2WvycuA_XIyoE7IT4kntmHI_HDcqg03bxIGwZd0KDZ-fDuMgaFjcnR9SIxZchoohKTFw0ITItpzr7NZ2XuuHULDV7-b_n1Ld0yLzmzMQiZIUX4hxWve_b3PiL';

const GOOGLE_LOGO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC3ruqI3A4nhJLQlSYq0Lr0q4T5eJL9UivHAJUOabTeKq1bQZGLW9NT_ScyAXIBl3XhNuHRoi0itJXDonXkS4Cf6KJhbjvnJ0Ydp3Ion2plpDgbdM8I87GGXuRicCT87b_6fCGjz0hC5iD2Zs9dR6GIIHMGKjlR1_g376KA5HHjfPTlQUhAzg2z_oOs6boU2Z1Qv_q8kED9PXW26aBhiui_Wqq5SBgdsrP0GswReMVYkHYklWlT4mMwb7uajqz3tvbm2swz3STucG3m';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitting) return;
    setError(null);

    if (!email.trim() || !password) {
      setError(t('auth.enterEmailPass'));
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError(t('auth.enterName'));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(name, email, password);
      }
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(t(authErrorKey(errorCode(e))));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const ok = await signInWithGoogle();
      if (ok) router.replace('/(tabs)');
    } catch (e: unknown) {
      const code = errorCode(e);
      if (code === statusCodes.SIGN_IN_CANCELLED) {
        // El usuario cerró el selector: no es un error.
      } else if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError(t('auth.googlePlayError'));
      } else {
        setError(t('auth.googleError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      setError(t('auth.forgotNoEmail'));
      return;
    }
    setError(null);
    try {
      await resetPassword(email);
      Alert.alert(t('auth.resetSentTitle'), t('auth.resetSentMsg'));
    } catch (e: unknown) {
      setError(t(authErrorKey(errorCode(e))));
    }
  };

  // Flecha decorativa con rebote.
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -8, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [bounce]);

  return (
    <View className="flex-1 bg-background">
      {/* Capa de fondo */}
      <Image
        source={{ uri: BG_IMAGE }}
        blurRadius={12}
        className="absolute inset-0 w-full h-full opacity-40"
      />
      <View className="absolute inset-0 bg-background/50" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center items-center px-4 py-10">
          {/* Branding */}
          <View className="items-center mb-8">
            <View className="bg-primary-container p-2 rounded-xl mb-4">
              <Icon name="restaurant" size={32} color={palette.onPrimaryContainer} />
            </View>
            <Text className="text-4xl font-extrabold text-primary tracking-tight">QuickBite</Text>
            <Text className="text-secondary text-sm font-semibold mt-1">
              {t('login.tagline')}
            </Text>
          </View>

          {/* Auth card */}
          <View className="w-full max-w-[440px] bg-white/90 rounded-[32px] overflow-hidden border border-white/50">
            {/* Tabs */}
            <View className="flex-row p-1 bg-surface-variant/30">
              <TouchableOpacity
                onPress={() => { setMode('signin'); setError(null); }}
                className="flex-1 py-4 rounded-2xl"
                style={mode === 'signin' ? { backgroundColor: palette.surfaceContainerLowest } : undefined}
              >
                <Text
                  className="text-center font-bold"
                  style={{ color: mode === 'signin' ? palette.primary : palette.secondary }}
                >
                  {t('auth.signIn')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setMode('register'); setError(null); }}
                className="flex-1 py-4 rounded-2xl"
                style={mode === 'register' ? { backgroundColor: palette.surfaceContainerLowest } : undefined}
              >
                <Text
                  className="text-center font-bold"
                  style={{ color: mode === 'register' ? palette.primary : palette.secondary }}
                >
                  {t('auth.createAccount')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View className="p-6">
              <View className="mb-6">
                <Text className="text-xl font-bold text-on-surface">
                  {mode === 'signin' ? t('auth.welcomeBack') : t('auth.join')}
                </Text>
                <Text className="text-secondary text-sm">
                  {mode === 'signin' ? t('auth.signinSub') : t('auth.registerSub')}
                </Text>
              </View>

              {/* Name (solo registro) */}
              {mode === 'register' && (
                <View className="gap-1 mb-4">
                  <Text className="text-sm font-semibold text-on-surface-variant px-1">{t('auth.fullName')}</Text>
                  <View className="relative justify-center">
                    <View className="absolute left-4 z-10">
                      <Icon name="person" color={palette.outline} size={22} />
                    </View>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="John Doe"
                      placeholderTextColor={palette.outline}
                      autoCapitalize="words"
                      className="h-14 pl-12 pr-4 bg-white/50 border border-outline-variant rounded-2xl text-base text-on-surface"
                    />
                  </View>
                </View>
              )}

              {/* Email */}
              <View className="gap-1 mb-4">
                <Text className="text-sm font-semibold text-on-surface-variant px-1">{t('auth.email')}</Text>
                <View className="relative justify-center">
                  <View className="absolute left-4 z-10">
                    <Icon name="mail" color={palette.outline} size={22} />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@example.com"
                    placeholderTextColor={palette.outline}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    className="h-14 pl-12 pr-4 bg-white/50 border border-outline-variant rounded-2xl text-base text-on-surface"
                  />
                </View>
              </View>

              {/* Password */}
              <View className="gap-1">
                <View className="flex-row justify-between items-center px-1">
                  <Text className="text-sm font-semibold text-on-surface-variant">{t('auth.password')}</Text>
                  {mode === 'signin' && (
                    <TouchableOpacity onPress={handleForgot}>
                      <Text className="text-xs font-semibold text-primary">{t('auth.forgot')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View className="relative justify-center">
                  <View className="absolute left-4 z-10">
                    <Icon name="lock" color={palette.outline} size={22} />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={palette.outline}
                    secureTextEntry={!showPassword}
                    className="h-14 pl-12 pr-12 bg-white/50 border border-outline-variant rounded-2xl text-base text-on-surface"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((s) => !s)}
                    className="absolute right-4 z-10"
                    accessibilityRole="button"
                    accessibilityLabel={t(showPassword ? 'a11y.hidePassword' : 'a11y.showPassword')}
                  >
                    <Icon name={showPassword ? 'visibility-off' : 'visibility'} color={palette.outline} size={22} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error */}
              {error && (
                <Text className="text-error text-sm font-medium text-center mt-4">{error}</Text>
              )}

              {/* Continue */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.9}
                className="h-14 bg-primary rounded-full items-center justify-center mt-6"
                style={submitting ? { opacity: 0.6 } : undefined}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    {mode === 'signin' ? t('auth.continue') : t('auth.createAccount')}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center py-4">
                <View className="flex-1 h-px bg-outline-variant/30" />
                <Text className="mx-3 text-[10px] text-secondary uppercase tracking-widest">
                  {t('auth.orContinue')}
                </Text>
                <View className="flex-1 h-px bg-outline-variant/30" />
              </View>

              {/* Social */}
              <TouchableOpacity
                onPress={handleGoogle}
                disabled={submitting}
                activeOpacity={0.8}
                className="flex-row items-center justify-center h-14 bg-white border border-outline-variant rounded-2xl"
                style={submitting ? { opacity: 0.6 } : undefined}
              >
                <Image source={{ uri: GOOGLE_LOGO }} className="w-5 h-5 mr-3" />
                <Text className="font-semibold text-on-surface">{t('auth.google')}</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View className="px-8 pb-8">
              <Text className="text-[11px] text-secondary text-center">
                {t('auth.termsPrefix')} <Text className="text-primary underline">{t('auth.terms')}</Text> {t('auth.and')}{' '}
                <Text className="text-primary underline">{t('auth.privacy')}</Text>
              </Text>
            </View>
          </View>

          {/* Flecha decorativa */}
          <Animated.View style={{ transform: [{ translateY: bounce }] }} className="mt-8">
            <Icon name="keyboard-double-arrow-down" size={28} color="rgba(0,110,47,0.4)" />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
