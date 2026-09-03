/**
 * screens/ProfileScreen.tsx
 * Perfil del repartidor: datos y vehículo (editables), resumen de actividad,
 * disponibilidad, apariencia (tema), ayuda/acerca de y cerrar sesión.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import { useMyOrders } from '../hooks/useMyOrders';
import { computeStats } from '../utils/stats';
import { formatCurrency } from '../utils/format';
import { radius, spacing, type Colors } from '../utils/theme';

// Correo de soporte del proyecto. Cámbialo por el real cuando exista.
const SUPPORT_EMAIL = 'soporte@quickbite.app';

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Claro', icon: 'sunny-outline' },
  { key: 'dark', label: 'Oscuro', icon: 'moon-outline' },
];

export function ProfileScreen() {
  const { driver, logout, toggleAvailability, updateProfile } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const orders = useMyOrders();
  const stats = useMemo(() => computeStats(orders ?? []), [orders]);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

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

  async function onContactSupport() {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      'Ayuda · QuickBite Driver'
    )}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) Linking.openURL(url);
    else Alert.alert('Soporte', `Escríbenos a ${SUPPORT_EMAIL}`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Perfil" />
      <ScrollView contentContainerStyle={styles.body}>
        {/* Tarjeta de identidad + vehículo */}
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.textInverse} />
          </View>
          <Text style={styles.name}>{driver.name}</Text>
          <Text style={styles.email}>{driver.email}</Text>
          {driver.phone ? <Text style={styles.email}>{driver.phone}</Text> : null}
          <View style={styles.vehicleChip}>
            <Ionicons name="bicycle-outline" size={14} color={colors.brand} />
            <Text style={styles.vehicleText}>
              {driver.vehicle?.trim() || 'Vehículo sin especificar'}
            </Text>
          </View>
          <Pressable style={styles.editBtn} onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={16} color={colors.brand} />
            <Text style={styles.editBtnText}>Editar perfil</Text>
          </Pressable>
        </View>

        {/* Resumen de actividad */}
        <View>
          <Text style={styles.sectionLabel}>Tu actividad</Text>
          <View style={styles.statsRow}>
            <StatCard
              icon="cube-outline"
              label="Entregas"
              value={String(stats.totalCount)}
              tone="info"
            />
            <StatCard
              icon="wallet-outline"
              label="Ganado"
              value={formatCurrency(stats.totalEarnings)}
              tone="success"
            />
            <StatCard
              icon="trending-up-outline"
              label="Promedio"
              value={formatCurrency(stats.avgPerDelivery)}
              tone="brand"
            />
          </View>
        </View>

        {/* Disponibilidad */}
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

        {/* Apariencia */}
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
                    style={[styles.segmentText, active && styles.segmentTextActive]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Ayuda y acerca de */}
        <View>
          <Text style={styles.sectionLabel}>Ayuda</Text>
          <Pressable style={styles.linkRow} onPress={onContactSupport}>
            <Ionicons name="help-buoy-outline" size={20} color={colors.brand} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Contactar a soporte</Text>
              <Text style={styles.rowSub}>{SUPPORT_EMAIL}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
          <View style={styles.aboutBox}>
            <Text style={styles.aboutTitle}>QuickBite Driver</Text>
            <Text style={styles.rowSub}>
              App de repartidores del ecosistema QuickBite. Versión {appVersion}.
            </Text>
          </View>
        </View>

        <Button label="Cerrar sesión" variant="danger" onPress={onLogout} />
      </ScrollView>

      <EditProfileModal
        visible={editing}
        initial={{
          name: driver.name,
          phone: driver.phone ?? '',
          vehicle: driver.vehicle ?? '',
        }}
        colors={colors}
        styles={styles}
        onClose={() => setEditing(false)}
        onSave={async (patch) => {
          await updateProfile(patch);
          setEditing(false);
        }}
      />
    </SafeAreaView>
  );
}

interface EditValues {
  name: string;
  phone: string;
  vehicle: string;
}

function EditProfileModal({
  visible,
  initial,
  colors,
  styles,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: EditValues;
  colors: Colors;
  styles: ReturnType<typeof makeStyles>;
  onClose: () => void;
  onSave: (patch: EditValues) => Promise<void>;
}) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [vehicle, setVehicle] = useState(initial.vehicle);
  const [saving, setSaving] = useState(false);

  // Rehidrata los campos cada vez que se abre el modal.
  useEffect(() => {
    if (visible) {
      setName(initial.name);
      setPhone(initial.phone);
      setVehicle(initial.vehicle);
    }
    // Solo al abrir; initial cambia por identidad en cada render del padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function onSubmit() {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Escribe tu nombre.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ name, phone, vehicle });
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Editar perfil</Text>

          <Text style={styles.fieldLabel}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.fieldLabel}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="10 dígitos"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>Vehículo</Text>
          <TextInput
            style={styles.input}
            value={vehicle}
            onChangeText={setVehicle}
            placeholder="Moto, bici, auto…"
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalBtn, styles.modalBtnGhost]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.modalBtnGhostText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, styles.modalBtnPrimary]}
              onPress={onSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.modalBtnPrimaryText}>Guardar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
    vehicleChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: c.brandSoft,
    },
    vehicleText: { fontSize: 13, fontWeight: '700', color: c.brand },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.md,
    },
    editBtnText: { fontSize: 14, fontWeight: '700', color: c.brand },
    statsRow: { flexDirection: 'row', gap: spacing.sm },
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
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    aboutBox: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
      marginTop: spacing.sm,
    },
    aboutTitle: { fontSize: 15, fontWeight: '800', color: c.text, marginBottom: 2 },
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
    // Modal editar perfil
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: spacing.xl,
      gap: spacing.sm,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: c.text,
      marginBottom: spacing.sm,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textMuted,
      marginTop: spacing.sm,
    },
    input: {
      backgroundColor: c.bg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 15,
      color: c.text,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    modalBtn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBtnGhost: { backgroundColor: c.surfaceMuted },
    modalBtnGhostText: { fontSize: 15, fontWeight: '700', color: c.text },
    modalBtnPrimary: { backgroundColor: c.brand },
    modalBtnPrimaryText: { fontSize: 15, fontWeight: '800', color: c.textInverse },
  });
