/**
 * screens/dashboard/PromotionsScreen.tsx
 * Gestión de cupones (tickets) y banners promocionales para la app móvil.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ScreenShell } from '../../components/layout/ScreenShell';
import { CouponCard } from '../../components/CouponCard';
import { OfferCard } from '../../components/OfferCard';
import { MetricCard } from '../../components/MetricCard';
import { Button } from '../../components/Button';
import { usePromotions } from '../../hooks/usePromotions';
import type { RootStackParamList } from '../../types/navigation';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { confirmAction } from '../../utils/confirm';
import { formatNumber } from '../../utils/format';
import { notifyError } from '../../utils/notify';

type Tab = 'coupons' | 'offers';

export function PromotionsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
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
  const [searchQuery, setSearchQuery] = useState('');

  const visibleCoupons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter((c) => c.code.toLowerCase().includes(q));
  }, [coupons, searchQuery]);

  const visibleOffers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return offers;
    return offers.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.badge.toLowerCase().includes(q) ||
        (o.couponCode ?? '').toLowerCase().includes(q)
    );
  }, [offers, searchQuery]);

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
      notifyError(
        err instanceof Error ? err.message : 'No se pudo eliminar el cupón'
      );
    }
  };

  const handleDeleteOffer = async (id: string, title: string) => {
    const confirmed = await confirmAction(
      'Eliminar oferta',
      `¿Eliminar "${title}"?`,
      { confirmText: 'Eliminar', destructive: true }
    );
    if (!confirmed) return;
    try {
      await removeOffer(id);
    } catch (err) {
      notifyError(
        err instanceof Error ? err.message : 'No se pudo eliminar la oferta'
      );
    }
  };

  return (
    <ScreenShell
      searchPlaceholder="Buscar cupones o banners..."
      onSearchChange={setSearchQuery}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.pageTitle}>Promociones</Text>
            <Text style={styles.subtitle}>
              Asigna cupones y banners con límites de uso, vigencia y pedido
              mínimo. Los clientes los verán en la app móvil.
            </Text>
          </View>
          <Button
            title={tab === 'coupons' ? 'Nuevo cupón' : 'Nueva oferta'}
            onPress={() =>
              tab === 'coupons'
                ? navigation.navigate('CouponForm', {})
                : navigation.navigate('OfferForm', {})
            }
          />
        </View>

        <View style={styles.metrics}>
          <MetricCard
            variant="compact"
            label="Cupones"
            value={formatNumber(coupons.length)}
            icon="tag"
            tone="primary"
          />
          <MetricCard
            variant="compact"
            label="Cupones activos"
            value={formatNumber(activeCoupons)}
            icon="check-circle"
            tone="success"
          />
          <MetricCard
            variant="compact"
            label="Ofertas"
            value={formatNumber(offers.length)}
            icon="image"
            tone="info"
          />
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
              Ofertas
            </Text>
          </TouchableOpacity>
        </View>

        {tab === 'coupons' ? (
          visibleCoupons.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="tag" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {searchQuery.trim() ? 'Sin resultados' : 'Sin cupones'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? 'Ningún cupón coincide con tu búsqueda.'
                  : 'Crea un cupón con tipo de descuento, pedido mínimo, usos máximos y fecha de vencimiento.'}
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {visibleCoupons.map((item) => (
                <View key={item.code} style={styles.couponWrap}>
                  <CouponCard
                    coupon={item}
                    onPress={() =>
                      navigation.navigate('CouponForm', { code: item.code })
                    }
                    onToggle={(v) => toggleCoupon(item.code, v)}
                    onDelete={() => handleDeleteCoupon(item.code)}
                  />
                </View>
              ))}
            </View>
          )
        ) : visibleOffers.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="image" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? 'Sin resultados' : 'Sin ofertas'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? 'Ninguna oferta coincide con tu búsqueda.'
                : 'Publica ofertas en el Home de la app: banner, cupón o platillo.'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {visibleOffers.map((item) => (
              <View key={item.id} style={styles.offerWrap}>
                <OfferCard
                  offer={item}
                  onPress={() =>
                    navigation.navigate('OfferForm', { offerId: item.id })
                  }
                  onToggle={(v) => toggleOffer(item.id, v)}
                  onDelete={() => handleDeleteOffer(item.id, item.title)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  titleBlock: { flex: 1, minWidth: 200 },
  pageTitle: {
    ...typography.h1,
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
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  couponWrap: {
    flexGrow: 1,
    flexBasis: 260,
    minWidth: 240,
    maxWidth: 280,
  },
  offerWrap: {
    flexGrow: 1,
    flexBasis: 238,
    minWidth: 200,
    maxWidth: 322,
  },
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
