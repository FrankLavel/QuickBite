/**
 * components/OrderCard.tsx
 * Tarjeta resumen de un pedido para las listas (theme-aware).
 */
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import type { Order } from '../types/order';
import { formatCurrency, timeAgo } from '../utils/format';
import { radius, spacing, type Colors } from '../utils/theme';
import { StatusBadge } from './StatusBadge';

interface Props {
  order: Order;
  onPress: () => void;
  /** Marca de tiempo a mostrar (p. ej. readyAt para disponibles). */
  timeField?: unknown;
}

export function OrderCard({ order, onPress, timeField }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const itemCount = order.items?.reduce((n, it) => n + (it.qty || 0), 0) ?? 0;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.id}>#{order.id.slice(0, 6).toUpperCase()}</Text>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.row}>
        <Ionicons name="location-outline" size={16} color={colors.textMuted} />
        <Text style={styles.address} numberOfLines={1}>
          {order.deliveryAddress?.street ?? 'Dirección no disponible'}
          {order.deliveryAddress?.city ? `, ${order.deliveryAddress.city}` : ''}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.meta}>
          {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'} ·{' '}
          {formatCurrency(order.total)}
        </Text>
        {timeField ? (
          <Text style={styles.time}>{timeAgo(timeField)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    pressed: { opacity: 0.9 },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    id: { fontSize: 15, fontWeight: '800', color: c.text },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    address: { flex: 1, color: c.textMuted, fontSize: 14 },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    meta: { fontSize: 14, fontWeight: '600', color: c.text },
    time: { fontSize: 12, color: c.textMuted },
  });
