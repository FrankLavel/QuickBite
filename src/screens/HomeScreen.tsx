/**
 * screens/HomeScreen.tsx
 * Inicio / Resumen del repartidor: saludo, disponibilidad, KPIs del día,
 * pedidos disponibles y entregas activas. Theme-aware.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatCard } from '../components/StatCard';
import { OrderCard } from '../components/OrderCard';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useMyOrders } from '../hooks/useMyOrders';
import { listenAvailableOrders, isActiveDelivery } from '../services/deliveryService';
import { computeStats } from '../utils/stats';
import { formatCurrency } from '../utils/format';
import type { Order } from '../types/order';
import type { RootStackParamList } from '../navigation/types';
import { radius, spacing, type Colors } from '../utils/theme';

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function HomeScreen() {
  const { driver, toggleAvailability } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const myOrders = useMyOrders();
  const [available, setAvailable] = useState<Order[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => listenAvailableOrders(setAvailable), []);

  const stats = useMemo(() => computeStats(myOrders ?? []), [myOrders]);
  const active = useMemo(
    () => (myOrders ?? []).filter(isActiveDelivery),
    [myOrders]
  );

  if (!driver) return null;
  const isOn = driver.isAvailable ?? true;

  async function onToggle(value: boolean) {
    setBusy(true);
    try {
      await toggleAvailability(value);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>{greeting()},</Text>
        <Text style={styles.name}>{driver.name} 👋</Text>

        {/* Disponibilidad */}
        <View style={styles.availCard}>
          <View
            style={[
              styles.availDot,
              { backgroundColor: isOn ? colors.success : colors.textMuted },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.availTitle}>
              {isOn ? 'Disponible' : 'No disponible'}
            </Text>
            <Text style={styles.availSub}>
              {isOn
                ? 'Estás activo para reclamar pedidos.'
                : 'Actívate para empezar a repartir.'}
            </Text>
          </View>
          <Switch
            value={isOn}
            onValueChange={onToggle}
            disabled={busy}
            trackColor={{ true: colors.brand, false: colors.border }}
          />
        </View>

        {/* KPIs del día */}
        <View style={styles.statsRow}>
          <StatCard
            icon="cash-outline"
            label="Ganancias hoy"
            value={formatCurrency(stats.todayEarnings)}
            tone="success"
          />
          <StatCard
            icon="checkmark-done-outline"
            label="Entregas hoy"
            value={String(stats.todayCount)}
            tone="brand"
          />
          <StatCard
            icon="bicycle-outline"
            label="Activas"
            value={String(stats.activeCount)}
            tone="info"
          />
        </View>

        {/* Pedidos disponibles */}
        <Pressable
          style={styles.cta}
          onPress={() => nav.navigate('Tabs', { screen: 'Available' })}
        >
          <View style={styles.ctaIcon}>
            <Ionicons name="fast-food" size={22} color={colors.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>
              {available.length > 0
                ? `${available.length} ${available.length === 1 ? 'pedido disponible' : 'pedidos disponibles'}`
                : 'Sin pedidos disponibles'}
            </Text>
            <Text style={styles.ctaSub}>Toca para ver y reclamar</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        {/* Entregas activas */}
        {active.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tus entregas activas</Text>
            <View style={{ gap: spacing.md }}>
              {active.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  timeField={o.assignedAt}
                  onPress={() =>
                    nav.navigate('OrderDetail', { orderId: o.id })
                  }
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    greeting: { fontSize: 15, color: c.textMuted },
    name: { fontSize: 26, fontWeight: '800', color: c.text, marginBottom: spacing.sm },
    availCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
    },
    availDot: { width: 12, height: 12, borderRadius: 6 },
    availTitle: { fontSize: 16, fontWeight: '800', color: c.text },
    availSub: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
    },
    ctaIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaTitle: { fontSize: 16, fontWeight: '800', color: c.text },
    ctaSub: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    section: { gap: spacing.sm, marginTop: spacing.xs },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: c.text },
  });
