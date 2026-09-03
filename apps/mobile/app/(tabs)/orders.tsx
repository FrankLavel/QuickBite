import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useOrders } from '@/hooks/useOrders';
import { useTranslation } from '@/hooks/useTranslation';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { OrderReceiptSheet } from '@/components/order/OrderReceiptSheet';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ordersService } from '@/services/orders.service';
import { restaurantsService } from '@/services/restaurants.service';
import { useCart } from '@/hooks/useCart';
import { cartLineId } from '@/store/cartStore';
import { Order, CartItemType } from '@/types/order.types';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Aviso tras intentar reordenar cuando hay platillos no disponibles o error. */
type ReorderNotice =
  | { mode: 'partial'; items: CartItemType[]; restaurantId: string }
  | { mode: 'none' }
  | { mode: 'error' };

const TABS = ['Active', 'Completed', 'Cancelled'] as const;
type Tab = (typeof TABS)[number];

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 4 },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [tab, setTab] = useState<Tab>('Active');
  const { activeOrders, completed, cancelled, restaurants, loading } = useOrders();

  const { reorder } = useCart();

  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reorderNotice, setReorderNotice] = useState<ReorderNotice | null>(null);

  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const goToCart = (items: CartItemType[], restaurantId: string) => {
    reorder(items, restaurantId);
    router.push('/cart');
  };

  /**
   * Reordena contra el menú ACTUAL del restaurante: usa precio/imagen vigentes
   * y omite los platillos que ya no existen o no están disponibles.
   */
  const handleReorder = async (order: Order) => {
    if (reorderingId) return;
    setReorderingId(order.id);
    try {
      const products = await restaurantsService.getProducts(order.restaurantId);
      const byId = new Map(products.map((p) => [p.id, p]));

      const items: CartItemType[] = [];
      let skipped = 0;
      for (const it of order.items) {
        const product = byId.get(it.productId); // getProducts ya filtra isAvailable
        if (!product) {
          skipped++;
          continue;
        }
        const toppings = it.toppings ?? [];
        const toppingsTotal = toppings.reduce((sum, tp) => sum + tp.price, 0);
        items.push({
          id: cartLineId(product.id, toppings, it.notes),
          productId: product.id,
          name: product.name,
          price: round2(product.price + toppingsTotal),
          quantity: it.qty,
          toppings,
          imageURL: product.imageURL,
          ...(it.notes ? { notes: it.notes } : {}),
        });
      }

      if (items.length === 0) {
        setReorderNotice({ mode: 'none' });
      } else if (skipped > 0) {
        setReorderNotice({ mode: 'partial', items, restaurantId: order.restaurantId });
      } else {
        goToCart(items, order.restaurantId);
      }
    } catch {
      setReorderNotice({ mode: 'error' });
    } finally {
      setReorderingId(null);
    }
  };

  const doCancel = async () => {
    if (!cancelTarget || cancelling) return;
    setCancelling(true);
    setCancelError('');
    try {
      await ordersService.cancelOrder(cancelTarget.id);
      setCancelTarget(null); // el listener lo mueve solo a la pestaña Cancelados
    } catch {
      setCancelError(t('tracking.cancelError'));
    } finally {
      setCancelling(false);
    }
  };

  const list: Order[] =
    tab === 'Active' ? activeOrders : tab === 'Completed' ? completed : cancelled;
  const tabLabel = (tb: Tab) => t(`orders.${tb.toLowerCase()}`);

  const renderOrder = (order: Order) => {
    const restaurant = restaurants[order.restaurantId];
    const itemsSummary = order.items.map((i) => `${i.qty}x ${i.name}`).join(', ');
    const dateLabel = order.createdAt
      ? format(order.createdAt.toDate(), "d MMM, yyyy • h:mm a", {
          locale: lang === 'es' ? es : undefined,
        })
      : '';
    const isActive = tab === 'Active';

    return (
      <TouchableOpacity
        key={order.id}
        onPress={() => setReceiptOrder(order)}
        activeOpacity={0.92}
        className="bg-surface-container-lowest rounded-xl p-4"
        style={cardShadow}
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-row gap-4 items-center flex-1 pr-2">
            <View className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container">
              {restaurant?.coverImage && (
                <Image source={{ uri: restaurant.coverImage }} className="w-full h-full" resizeMode="cover" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-on-surface" numberOfLines={1}>
                {restaurant?.name ?? t('orders.restaurant')}
              </Text>
              <Text className="text-xs text-on-surface-variant">{dateLabel}</Text>
            </View>
          </View>
          <OrderStatusBadge status={order.status} />
        </View>

        {/* Items */}
        {!!itemsSummary && (
          <View className="py-4 border-t border-b border-surface-variant mb-4">
            <Text className="text-base text-on-surface-variant" numberOfLines={2}>{itemsSummary}</Text>
          </View>
        )}

        {/* Footer */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-on-surface-variant">{t('orders.totalPrice')}</Text>
            <Text className="text-lg font-bold text-primary">${order.total.toFixed(2)}</Text>
          </View>
          {isActive ? (
            <View className="flex-row items-center gap-2">
              {order.status === 'pending' && (
                <TouchableOpacity
                  onPress={() => {
                    setCancelError('');
                    setCancelTarget(order);
                  }}
                  activeOpacity={0.9}
                  className="border border-error px-4 h-11 rounded-full items-center justify-center"
                >
                  <Text className="text-error text-sm font-bold">{t('common.cancel')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => router.push(`/tracking?orderId=${order.id}`)}
                activeOpacity={0.9}
                className="bg-primary px-5 h-11 rounded-full flex-row items-center gap-1"
              >
                <Icon name="my-location" color="#ffffff" size={18} />
                <Text className="text-on-primary text-sm font-bold">{t('orders.track')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => handleReorder(order)}
              disabled={reorderingId === order.id}
              activeOpacity={0.9}
              className="bg-primary px-6 h-11 rounded-full flex-row items-center gap-1"
              style={reorderingId === order.id ? { opacity: 0.6 } : undefined}
            >
              {reorderingId === order.id ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Icon name="reorder" color="#ffffff" size={18} />
                  <Text className="text-on-primary text-sm font-bold">{t('orders.reorder')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Top App Bar */}
      <View className="flex-row justify-between items-center px-4 py-2 bg-background">
        <View className="flex-row items-center gap-2">
          <Icon name="receipt-long" color={palette.primary} />
          <Text className="text-xl font-bold text-on-surface">{t('orders.title')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/notifications')}
          activeOpacity={0.7}
          className="p-2 rounded-full"
          accessibilityRole="button"
          accessibilityLabel={t('a11y.notifications')}
        >
          <Icon name="notifications" />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View className="flex-row border-b border-outline-variant px-4">
        {TABS.map((tb) => {
          const isOn = tab === tb;
          return (
            <TouchableOpacity
              key={tb}
              onPress={() => setTab(tb)}
              className="flex-1 py-4 items-center"
              style={isOn ? { borderBottomWidth: 3, borderBottomColor: palette.primary } : undefined}
            >
              <Text
                className="text-sm font-bold"
                style={{ color: isOn ? palette.primary : palette.onSurfaceVariant }}
              >
                {tabLabel(tb)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : list.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-surface-container items-center justify-center mb-6">
            <Icon name="receipt-long" size={48} color={palette.outlineVariant} />
          </View>
          <Text className="text-2xl font-bold text-on-surface mb-2">{t('orders.empty')}</Text>
          <Text className="text-base text-on-surface-variant text-center max-w-xs">
            {t('orders.emptyDesc')}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.9}
            className="mt-6 bg-primary px-8 h-14 rounded-full items-center justify-center"
          >
            <Text className="text-on-primary text-sm font-bold">{t('orders.browse')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-4 py-6 gap-4">
          {list.map(renderOrder)}
        </ScrollView>
      )}

      <ConfirmDialog
        visible={!!cancelTarget}
        title={t('tracking.cancelTitle')}
        message={t('tracking.cancelMessage')}
        confirmLabel={t('tracking.cancelConfirm')}
        cancelLabel={t('tracking.cancelDismiss')}
        onConfirm={doCancel}
        onCancel={() => setCancelTarget(null)}
        destructive
        loading={cancelling}
        errorMessage={cancelError}
      />

      {/* Aviso de reorder: algunos/ninguno disponible, o error */}
      <ConfirmDialog
        visible={reorderNotice?.mode === 'partial'}
        title={t('reorder.partialTitle')}
        message={t('reorder.partialMessage')}
        confirmLabel={t('reorder.continue')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          if (reorderNotice?.mode === 'partial') {
            const { items, restaurantId } = reorderNotice;
            setReorderNotice(null);
            goToCart(items, restaurantId);
          }
        }}
        onCancel={() => setReorderNotice(null)}
      />
      <ConfirmDialog
        visible={reorderNotice?.mode === 'none' || reorderNotice?.mode === 'error'}
        title={reorderNotice?.mode === 'error' ? t('reorder.errorTitle') : t('reorder.noneTitle')}
        message={reorderNotice?.mode === 'error' ? t('reorder.errorMessage') : t('reorder.noneMessage')}
        confirmLabel={t('reorder.ok')}
        cancelLabel=""
        hideCancel
        onConfirm={() => setReorderNotice(null)}
        onCancel={() => setReorderNotice(null)}
      />

      <OrderReceiptSheet
        order={receiptOrder}
        restaurantName={
          receiptOrder ? restaurants[receiptOrder.restaurantId]?.name : undefined
        }
        onClose={() => setReceiptOrder(null)}
      />
    </SafeAreaView>
  );
}
