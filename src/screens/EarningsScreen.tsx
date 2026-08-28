/**
 * screens/EarningsScreen.tsx
 * Ganancias y estadísticas del repartidor + liquidación + historial de entregas.
 * Ingreso por entrega = tarifa fija + propina; liquidación manual solo tarjeta.
 * Theme-aware.
 */
import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatCard } from '../components/StatCard';
import { OrderCard } from '../components/OrderCard';
import { EmptyState } from '../components/EmptyState';
import { ScreenHeader } from '../components/ScreenHeader';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useMyOrders } from '../hooks/useMyOrders';
import { computeStats } from '../utils/stats';
import { computeSettlement } from '../utils/earnings';
import { markDriverSettled } from '../services/deliveryService';
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

  const [settling, setSettling] = useState(false);
  const stats = useMemo(() => computeStats(myOrders ?? []), [myOrders]);
  const settlement = useMemo(
    () => computeSettlement(myOrders ?? []),
    [myOrders]
  );

  function onSettle() {
    if (settlement.pendingIds.length === 0) return;
    Alert.alert(
      'Marcar como liquidado',
      `Confirma que ya recibiste ${formatCurrency(settlement.owedCard)} por ${settlement.owedCount} entrega(s) con tarjeta.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setSettling(true);
            try {
              await markDriverSettled(settlement.pendingIds);
            } catch {
              Alert.alert('Error', 'No se pudo marcar la liquidación.');
            } finally {
              setSettling(false);
            }
          },
        },
      ]
    );
  }

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

      <View style={styles.settleCard}>
        <Text style={styles.settleTitle}>Liquidación</Text>
        <View style={styles.settleRow}>
          <Text style={styles.settleLabel}>La plataforma te debe (tarjeta)</Text>
          <Text style={styles.settleOwed}>
            {formatCurrency(settlement.owedCard)}
          </Text>
        </View>
        <View style={styles.settleRow}>
          <Text style={styles.settleLabel}>Efectivo a remitir</Text>
          <Text style={styles.settleRemit}>
            {formatCurrency(settlement.cashToRemit)}
          </Text>
        </View>
        {settlement.owedCount > 0 ? (
          <Button
            label={`Marcar liquidado (${settlement.owedCount})`}
            onPress={onSettle}
            loading={settling}
            style={styles.settleBtn}
          />
        ) : (
          <Text style={styles.settleDone}>Sin pagos pendientes por tarjeta.</Text>
        )}
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
    settleCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    settleTitle: { fontSize: 16, fontWeight: '800', color: c.text },
    settleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    settleLabel: { fontSize: 14, color: c.textMuted, flexShrink: 1 },
    settleOwed: { fontSize: 16, fontWeight: '800', color: c.success },
    settleRemit: { fontSize: 15, fontWeight: '700', color: c.textMuted },
    settleBtn: { marginTop: spacing.xs },
    settleDone: { fontSize: 13, color: c.textMuted, marginTop: spacing.xs },
    listTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: c.text,
      marginTop: spacing.xs,
    },
  });
