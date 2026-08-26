/**
 * screens/AvailableOrdersScreen.tsx
 * Pedidos 'listos para recoger' sin repartidor. El repartidor puede abrir el
 * detalle y reclamarlos (modelo auto-servicio). Theme-aware.
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
import { listenAvailableOrders } from '../services/deliveryService';
import type { Order } from '../types/order';
import type { RootStackParamList } from '../navigation/types';
import { spacing, type Colors } from '../utils/theme';

export function AvailableOrdersScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => listenAvailableOrders(setOrders), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Disponibles"
        subtitle="Pedidos listos para recoger"
        count={orders?.length}
      />
      <FlatList
        data={orders ?? []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            timeField={item.readyAt ?? item.createdAt}
            onPress={() => nav.navigate('OrderDetail', { orderId: item.id })}
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
