/**
 * screens/auth/LoginScreen.tsx
 * Inicio de sesión del repartidor (correo/contraseña). Rechaza cuentas que no
 * tengan rol 'driver'. Theme-aware.
 */
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { useAuth, NotADriverError } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, type Colors } from '../../utils/theme';

function authErrorMessage(error: unknown): string {
  if (error instanceof NotADriverError) return error.message;
  const code = (error as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-email': 'El correo no es válido.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
    'auth/network-request-failed': 'Error de red. Revisa tu conexión.',
  };
  return map[code] ?? 'No se pudo iniciar sesión. Intenta de nuevo.';
}

export function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Escribe tu correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logo}>
            <Ionicons name="bicycle" size={40} color={colors.textInverse} />
          </View>
          <Text style={styles.title}>QuickBite Driver</Text>
          <Text style={styles.subtitle}>Entra con tu cuenta de repartidor</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Correo</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tucorreo@ejemplo.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Iniciar sesión"
            onPress={onSubmit}
            loading={loading}
            style={styles.submit}
          />

          <Text style={styles.hint}>
            ¿No tienes cuenta? El administrador de QuickBite la crea por ti.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    scroll: { padding: spacing.xl, justifyContent: 'center', flexGrow: 1 },
    logo: {
      width: 72,
      height: 72,
      borderRadius: radius.lg,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: c.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: c.textMuted,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    field: { marginBottom: spacing.md },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      minHeight: 48,
      fontSize: 16,
      color: c.text,
    },
    error: { color: c.danger, fontSize: 14, marginBottom: spacing.sm },
    submit: { marginTop: spacing.sm },
    hint: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
  });
