/**
 * components/AvailableOrderCard.tsx
 * Tarjeta de un pedido disponible (proyección redactada, SIN PII del cliente).
 * Muestra restaurante, zona, artículos y total, con un botón para reclamarlo.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';
import type { AvailableOrder } from '../types/availableOrder';
import { formatCurrency, timeAgo } from '../utils/format';
import { radius, spacing, type Colors } from '../utils/theme';

interface Props {
  order: AvailableOrder;
  onClaim: () => void;
  claiming?: boolean;
}

export function AvailableOrderCard({ order, onClaim, claiming }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.restaurant}>
          <Ionicons name="restaurant-outline" size={16} color={colors.brandDark} />
          <Text style={styles.name} numberOfLines={1}>
            {order.restaurantName || 'Restaurante'}
          </Text>
        </View>
        {order.orderCreatedAt ? (
          <Text style={styles.time}>{timeAgo(order.orderCreatedAt)}</Text>
        ) : null}
      </View>

      {order.city ? (
        <View style={styles.row}>
          <Ionicons name="navigate-outline" size={15} color={colors.textMuted} />
          <Text style={styles.city} numberOfLines={1}>
            Entrega en {order.city}
          </Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {order.itemCount} {order.itemCount === 1 ? 'artículo' : 'artículos'} ·{' '}
          {formatCurrency(order.total)}
        </Text>
      </View>

      <Button
        label="Reclamar pedido"
        onPress={onClaim}
        loading={claiming}
        style={styles.btn}
      />
    </View>
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    restaurant: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    name: { fontSize: 16, fontWeight: '800', color: c.text, flexShrink: 1 },
    time: { fontSize: 12, color: c.textMuted },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    city: { color: c.textMuted, fontSize: 14, flexShrink: 1 },
    metaRow: { marginTop: 2 },
    meta: { fontSize: 15, fontWeight: '600', color: c.text },
    btn: { marginTop: spacing.sm },
  });
