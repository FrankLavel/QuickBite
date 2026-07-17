import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { OrderStatusBadge } from './OrderStatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import { Order } from '@/types/order.types';

interface OrderReceiptSheetProps {
  order: Order | null;
  restaurantName?: string;
  onClose: () => void;
}

const PAY_KEY = {
  cash: 'receipt.payCash',
  card: 'receipt.payCard',
  paypal: 'receipt.payPaypal',
} as const;

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-on-surface-variant">{label}</Text>
      <Text
        className={`text-sm font-semibold ${accent ? 'text-primary' : 'text-on-surface'}`}
      >
        {value}
      </Text>
    </View>
  );
}

export function OrderReceiptSheet({
  order,
  restaurantName,
  onClose,
}: OrderReceiptSheetProps) {
  const { t, lang } = useTranslation();
  const { height } = useWindowDimensions();

  if (!order) return null;

  const date = order.createdAt
    ? format(order.createdAt.toDate(), 'd MMM, yyyy • h:mm a', {
        locale: lang === 'es' ? es : undefined,
      })
    : '';
  const addr = order.deliveryAddress;

  return (
    <BottomSheet visible onClose={onClose}>
      <View className="items-center mb-4">
        <View className="w-10 h-1.5 rounded-full bg-surface-variant" />
      </View>

      <View className="flex-row justify-between items-start mb-1">
        <Text className="text-xl font-bold text-on-surface">
          {t('receipt.title')}
        </Text>
        <OrderStatusBadge status={order.status} />
      </View>
      {restaurantName ? (
        <Text className="text-base font-semibold text-on-surface">
          {restaurantName}
        </Text>
      ) : null}
      <Text className="text-xs text-on-surface-variant">{date}</Text>
      <Text className="text-xs text-on-surface-variant mb-4">
        #{order.id.slice(0, 8).toUpperCase()}
      </Text>

      <ScrollView
        style={{ maxHeight: height * 0.52 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Artículos */}
        <View className="border-t border-surface-variant pt-4 gap-3">
          {order.items.map((it, idx) => (
            <View key={`${it.productId}-${idx}`} className="flex-row justify-between gap-3">
              <View className="flex-1">
                <Text className="text-base font-semibold text-on-surface">
                  {it.qty}x {it.name}
                </Text>
                {it.toppings && it.toppings.length > 0 ? (
                  <Text className="text-sm text-on-surface-variant">
                    + {it.toppings.map((tp) => tp.name).join(', ')}
                  </Text>
                ) : null}
                {it.notes ? (
                  <Text className="text-sm italic text-on-surface-variant">
                    ↳ {it.notes}
                  </Text>
                ) : null}
              </View>
              <Text className="text-base font-semibold text-on-surface">
                ${it.subtotal.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View className="border-t border-surface-variant mt-4 pt-4 gap-2">
          <Row label={t('cart.subtotal')} value={`$${order.subtotal.toFixed(2)}`} />
          <Row
            label={t('cart.deliveryFee')}
            value={`$${order.deliveryFee.toFixed(2)}`}
          />
          {order.discount > 0 ? (
            <Row
              label={t('cart.discount')}
              value={`-$${order.discount.toFixed(2)}`}
              accent
            />
          ) : null}
        </View>
        <View className="border-t border-surface-variant mt-3 pt-3 flex-row justify-between items-center">
          <Text className="text-lg font-bold text-on-surface">
            {t('cart.total')}
          </Text>
          <Text className="text-lg font-bold text-primary">
            ${order.total.toFixed(2)}
          </Text>
        </View>

        {/* Entrega */}
        <View className="mt-5">
          <Text className="text-xs font-bold text-on-surface-variant uppercase mb-1">
            {t('receipt.deliverTo')}
          </Text>
          <Text className="text-sm text-on-surface">
            {addr.street}
            {addr.city ? `, ${addr.city}` : ''}
          </Text>
          {addr.references ? (
            <Text className="text-xs text-on-surface-variant">
              {addr.references}
            </Text>
          ) : null}
        </View>

        {/* Pago */}
        <View className="mt-4 flex-row justify-between">
          <Text className="text-sm text-on-surface-variant">
            {t('checkout.paymentMethod')}
          </Text>
          <Text className="text-sm font-semibold text-on-surface">
            {t(PAY_KEY[order.paymentMethod])}
          </Text>
        </View>

        {/* Instrucciones */}
        {order.specialInstructions ? (
          <View className="mt-4">
            <Text className="text-xs font-bold text-on-surface-variant uppercase mb-1">
              {t('checkout.instructions')}
            </Text>
            <Text className="text-sm italic text-on-surface-variant">
              “{order.specialInstructions}”
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </BottomSheet>
  );
}
