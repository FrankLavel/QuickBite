/**
 * screens/AvailableOrdersScreen.tsx
 * Pedidos disponibles (proyección redactada sin PII). El repartidor los reclama
 * desde aquí; al lograrlo, abre el detalle ya con los datos completos.
 */
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AvailableOrderCard } from '../components/AvailableOrderCard';
import { EmptyState } from '../components/EmptyState';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { listenAvailableOrders, claimOrder } from '../services/deliveryService';
import type { AvailableOrder } from '../types/availableOrder';
import type { RootStackParamList } from '../navigation/types';
import { spacing, type Colors } from '../utils/theme';

export function AvailableOrdersScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { driver } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [orders, setOrders] = useState<AvailableOrder[] | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => listenAvailableOrders(setOrders), []);

  async function onClaim(order: AvailableOrder) {
    if (!driver || claimingId) return;
    setClaimingId(order.orderId);
    try {
      await claimOrder(order.orderId, driver);
      nav.navigate('OrderDetail', { orderId: order.orderId });
    } catch (e) {
      Alert.alert('No se pudo reclamar', (e as Error)?.message ?? 'Intenta con otro.');
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Disponibles"
        subtitle="Pedidos listos para recoger"
        count={orders?.length}
      />
      <FlatList
        data={orders ?? []}
        keyExtractor={(o) => o.orderId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AvailableOrderCard
            order={item}
            claiming={claimingId === item.orderId}
            onClaim={() => onClaim(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          orders === null ? null : (
            <EmptyState
              icon="fast-food-outline"
              title="No hay pedidos disponibles"
              subtitle="Cuando un restaurante marque un pedido como listo, aparecerá aquí."
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
    list: { padding: spacing.lg, flexGrow: 1 },
  });
