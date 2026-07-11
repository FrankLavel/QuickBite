/**
 * screens/dashboard/PromotionsScreen.tsx
 * Gestión de cupones (tickets) y banners promocionales para la app móvil.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { CouponCard } from '../../components/CouponCard';
import { OfferCard } from '../../components/OfferCard';
import { Button } from '../../components/Button';
import { usePromotions } from '../../hooks/usePromotions';
import type { RootStackParamList } from '../../types/navigation';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { confirmAction } from '../../utils/confirm';

type Tab = 'coupons' | 'offers';

export function PromotionsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const {
    coupons,
    offers,
    loading,
    refresh,
    toggleCoupon,
    removeCoupon,
    toggleOffer,
    removeOffer,
  } = usePromotions();

  const [tab, setTab] = useState<Tab>('coupons');

  const numColumns = width >= 900 ? 2 : 1;
  const gap = spacing.md;
  const cardWidth =
    numColumns === 1
      ? width - spacing.md * 2
      : (width - spacing.md * 2 - gap) / 2;

  const activeCoupons = useMemo(
    () => coupons.filter((c) => c.isActive).length,
    [coupons]
  );

  const handleDeleteCoupon = async (code: string) => {
    const confirmed = await confirmAction(
      'Eliminar cupón',
      `¿Eliminar el cupón "${code}"? Los clientes ya no podrán usarlo.`,
      { confirmText: 'Eliminar', destructive: true }
    );
    if (!confirmed) return;
    try {
      await removeCoupon(code);
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'No se pudo eliminar'
      );
    }
  };

  const handleDeleteOffer = async (id: string, title: string) => {
    const confirmed = await confirmAction(
      'Eliminar banner',
      `¿Eliminar "${title}"?`,
      { confirmText: 'Eliminar', destructive: true }
    );
    if (!confirmed) return;
    try {
      await removeOffer(id);
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'No se pudo eliminar'
      );
    }
  };

  return (
    <ScreenShell searchPlaceholder="Buscar cupones o banners...">
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>Promociones</Text>
          <Text style={styles.subtitle}>
            Asigna cupones y banners con límites de uso, vigencia y pedido mínimo.
            Los clientes los verán en la app móvil.
          </Text>
        </View>
        <Button
          title={tab === 'coupons' ? 'Nuevo cupón' : 'Nuevo banner'}
          onPress={() =>
            tab === 'coupons'
              ? navigation.navigate('CouponForm', {})
              : navigation.navigate('OfferForm', {})
          }
        />
      </View>

      <View style={styles.metrics}>
        <View style={styles.metricChip}>
          <Text style={styles.metricValue}>{coupons.length}</Text>
          <Text style={styles.metricLabel}>Cupones</Text>
        </View>
        <View style={styles.metricChip}>
          <Text style={styles.metricValue}>{activeCoupons}</Text>
          <Text style={styles.metricLabel}>Cupones activos</Text>
        </View>
        <View style={styles.metricChip}>
          <Text style={styles.metricValue}>{offers.length}</Text>
          <Text style={styles.metricLabel}>Banners</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'coupons' && styles.tabActive]}
          onPress={() => setTab('coupons')}
        >
          <Feather
            name="tag"
            size={16}
            color={tab === 'coupons' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[styles.tabText, tab === 'coupons' && styles.tabTextActive]}
          >
            Cupones / Tickets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'offers' && styles.tabActive]}
          onPress={() => setTab('offers')}
        >
          <Feather
            name="image"
            size={16}
            color={tab === 'offers' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[styles.tabText, tab === 'offers' && styles.tabTextActive]}
          >
            Banners
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'coupons' ? (
        <FlatList
          key={`coupons-${numColumns}`}
          data={coupons}
          keyExtractor={(item) => item.code}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="tag" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin cupones</Text>
              <Text style={styles.emptyText}>
                Crea un cupón con tipo de descuento, pedido mínimo, usos máximos
                y fecha de vencimiento.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ width: cardWidth }}>
              <CouponCard
                coupon={item}
                onPress={() =>
                  navigation.navigate('CouponForm', { code: item.code })
                }
                onToggle={(v) => toggleCoupon(item.code, v)}
                onDelete={() => handleDeleteCoupon(item.code)}
              />
            </View>
          )}
        />
      ) : (
        <FlatList
          key={`offers-${numColumns}`}
          data={offers}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="image" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin banners</Text>
              <Text style={styles.emptyText}>
                Publica banners en el Home de la app. Puedes vincular un cupón
                opcional.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ width: cardWidth }}>
              <OfferCard
                offer={item}
                onPress={() =>
                  navigation.navigate('OfferForm', { offerId: item.id })
                }
                onToggle={(v) => toggleOffer(item.id, v)}
                onDelete={() => handleDeleteOffer(item.id, item.title)}
              />
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  titleBlock: { flex: 1, minWidth: 200 },
  pageTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    maxWidth: 520,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  metricChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '800',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: { color: colors.primary },
  list: { paddingBottom: spacing.xl },
  row: { gap: spacing.md, marginBottom: 0 },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
