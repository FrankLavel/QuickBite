/**
 * screens/ProfileScreen.tsx
 * Perfil del repartidor: datos, disponibilidad, apariencia (tema) y cerrar sesión.
 */
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import { radius, spacing, type Colors } from '../utils/theme';

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Claro', icon: 'sunny-outline' },
  { key: 'dark', label: 'Oscuro', icon: 'moon-outline' },
];

export function ProfileScreen() {
  const { driver, logout, toggleAvailability } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [busy, setBusy] = useState(false);

  if (!driver) return null;

  async function onToggle(value: boolean) {
    setBusy(true);
    try {
      await toggleAvailability(value);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar tu disponibilidad.');
    } finally {
      setBusy(false);
    }
  }

  function onLogout() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Perfil" />
      <View style={styles.body}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.textInverse} />
          </View>
          <Text style={styles.name}>{driver.name}</Text>
          <Text style={styles.email}>{driver.email}</Text>
          {driver.phone ? (
            <Text style={styles.email}>{driver.phone}</Text>
          ) : null}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Disponible para entregas</Text>
            <Text style={styles.rowSub}>
              {driver.isAvailable
                ? 'Puedes reclamar pedidos.'
                : 'No aparecerás como activo.'}
            </Text>
          </View>
          <Switch
            value={driver.isAvailable ?? true}
            onValueChange={onToggle}
            disabled={busy}
            trackColor={{ true: colors.brand, false: colors.border }}
          />
        </View>

        <View>
          <Text style={styles.sectionLabel}>Apariencia</Text>
          <View style={styles.segment}>
            {THEME_OPTIONS.map((opt) => {
              const active = mode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setMode(opt.key)}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={16}
                    color={active ? colors.textInverse : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      active && styles.segmentTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button label="Cerrar sesión" variant="danger" onPress={onLogout} />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    body: { padding: spacing.lg, gap: spacing.lg },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.xs,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    name: { fontSize: 18, fontWeight: '800', color: c.text },
    email: { fontSize: 14, color: c.textMuted },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    rowTitle: { fontSize: 15, fontWeight: '700', color: c.text },
    rowSub: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textMuted,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: 4,
      gap: 4,
    },
    segmentItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
    },
    segmentItemActive: { backgroundColor: c.brand },
    segmentText: { fontSize: 14, fontWeight: '700', color: c.textMuted },
    segmentTextActive: { color: c.textInverse },
  });
