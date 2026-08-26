/**
 * components/StatusBadge.tsx
 * Insignia del estado del pedido (theme-aware).
 */
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ORDER_STATUS_LABELS } from '../utils/constants';
import { radius, statusColorFor } from '../utils/theme';

export function StatusBadge({ status }: { status: string }) {
  const { colors } = useTheme();
  const color = statusColorFor(colors, status);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>
        {ORDER_STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: '700' },
});
