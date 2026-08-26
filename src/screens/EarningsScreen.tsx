/**
 * screens/EarningsScreen.tsx
 * Ganancias y estadísticas del repartidor + historial de entregas completadas.
 * El ingreso por pedido es la tarifa de reparto (deliveryFee). Theme-aware.
 */
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatCard } from '../components/StatCard';
import { OrderCard } from '../components/OrderCard';
import { EmptyState } from '../components/EmptyState';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { useMyOrders } from '../hooks/useMyOrders';
import { computeStats } from '../utils/stats';
import { formatCurrency, toDate } from '../utils/format';
import { ORDER_STATUS } from '../utils/constants';
import type { Order } from '../types/order';
import type { RootStackParamList } from '../navigation/types';
import { radius, spacing, type Colors } from '../utils/theme';

export function EarningsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const myOrders = useMyOrders();

  const stats = useMemo(() => computeStats(myOrders ?? []), [myOrders]);
  const delivered = useMemo(() => {
    const list = (myOrders ?? []).filter(
      (o) => o.status === ORDER_STATUS.DELIVERED
    );
    return list.sort(
      (a, b) =>
        (toDate(b.deliveredAt)?.getTime() ?? 0) -
        (toDate(a.deliveredAt)?.getTime() ?? 0)
    );
  }, [myOrders]);

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Ganancias totales</Text>
        <Text style={styles.heroValue}>
          {formatCurrency(stats.totalEarnings)}
        </Text>
        <Text style={styles.heroSub}>
          {stats.totalCount}{' '}
          {stats.totalCount === 1 ? 'entrega' : 'entregas'} · promedio{' '}
          {formatCurrency(stats.avgPerDelivery)}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="today-outline"
          label="Hoy"
          value={formatCurrency(stats.todayEarnings)}
          tone="success"
        />
        <StatCard
          icon="calendar-outline"
          label="Esta semana"
          value={formatCurrency(stats.weekEarnings)}
          tone="brand"
        />
      </View>

      {delivered.length > 0 ? (
        <Text style={styles.listTitle}>Historial de entregas</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Ganancias" subtitle="Tu actividad como repartidor" />
      <FlatList
        data={delivered}
        keyExtractor={(o: Order) => o.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            timeField={item.deliveredAt}
            onPress={() => nav.navigate('OrderDetail', { orderId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          myOrders === null ? null : (
            <EmptyState
              icon="wallet-outline"
              title="Aún no tienes ganancias"
              subtitle="Completa entregas para ver aquí tus ingresos."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    list: { padding: spacing.lg, flexGrow: 1, gap: 0 },
    headerBlock: { gap: spacing.md, marginBottom: spacing.md },
    hero: {
      backgroundColor: c.brand,
      borderRadius: radius.lg,
      padding: spacing.xl,
      gap: 2,
    },
    heroLabel: { fontSize: 14, color: c.textInverse, opacity: 0.9 },
    heroValue: { fontSize: 34, fontWeight: '800', color: c.textInverse },
    heroSub: { fontSize: 13, color: c.textInverse, opacity: 0.9, marginTop: 4 },
    statsRow: { flexDirection: 'row', gap: spacing.md },
    listTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: c.text,
      marginTop: spacing.xs,
    },
  });
