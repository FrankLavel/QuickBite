/**
 * screens/MyDeliveriesScreen.tsx
 * Entregas activas del repartidor (reclamadas o en camino). Theme-aware.
 */
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OrderCard } from '../components/OrderCard';
import { EmptyState } from '../components/EmptyState';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { listenMyOrders, isActiveDelivery } from '../services/deliveryService';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../types/order';
import type { RootStackParamList } from '../navigation/types';
import { spacing, type Colors } from '../utils/theme';

export function MyDeliveriesScreen() {
  const { driver } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!driver) return;
    return listenMyOrders(driver.uid, (all) =>
      setOrders(all.filter(isActiveDelivery))
    );
  }, [driver]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Mis entregas"
        subtitle="Pedidos que estás repartiendo"
        count={orders?.length}
      />
      <FlatList
        data={orders ?? []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            timeField={item.assignedAt}
            onPress={() => nav.navigate('OrderDetail', { orderId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          orders === null ? null : (
            <EmptyState
              icon="cube-outline"
              title="No tienes entregas activas"
              subtitle="Reclama un pedido desde la pestaña Disponibles."
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
