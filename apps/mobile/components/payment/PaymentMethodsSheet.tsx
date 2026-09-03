import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useTranslation } from '@/hooks/useTranslation';
import { useSavedCards } from '@/hooks/useSavedCards';
import { paymentsService } from '@/services/payments.service';
import { showConfirm } from '@/store/dialogStore';
import { OpenpayCardSheet } from './OpenpayCardSheet';
import type { OpenpayToken } from '@/services/payments.service';
import { SavedCard } from '@/types/card.types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function cardLabel(c: SavedCard): string {
  const brand = c.brand
    ? c.brand.charAt(0).toUpperCase() + c.brand.slice(1)
    : 'Tarjeta';
  return `${brand} ···· ${c.cardLast4 ?? '••••'}`;
}

/**
 * Gestión de métodos de pago: tarjetas guardadas (bóveda de Openpay) + efectivo.
 * El PAN nunca se guarda en QuickBite; solo referencias (marca, últimos 4).
 */
export function PaymentMethodsSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { cards, loading } = useSavedCards();
  const [addVisible, setAddVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onNewToken = async (token: OpenpayToken) => {
    setAddVisible(false);
    setSaving(true);
    setError(null);
    try {
      await paymentsService.saveCard(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('payment.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const removeCard = async (c: SavedCard) => {
    const ok = await showConfirm({
      title: t('payment.removeTitle'),
      message: cardLabel(c),
      confirmLabel: t('payment.remove'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    setBusyId(c.id);
    setError(null);
    try {
      await paymentsService.deleteCard(c.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('payment.removeError'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <SafeAreaView
          edges={['bottom']}
          className="bg-surface-container-lowest rounded-t-3xl max-h-[90%]"
        >
          <View className="flex-row items-center justify-between px-5 pt-5 pb-2">
            <View className="flex-row items-center gap-2">
              <Icon name="account-balance-wallet" size={20} color={palette.primary} />
              <Text className="text-lg font-bold text-on-surface">
                {t('payment.methodsTitle')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-full">
              <Icon name="close" color={palette.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="px-5"
            contentContainerClassName="pb-6 gap-3"
            showsVerticalScrollIndicator={false}
          >
            {/* Tarjetas guardadas */}
            <Text className="text-sm font-bold text-on-surface-variant mt-1">
              {t('payment.yourCards')}
            </Text>

            {loading ? (
              <ActivityIndicator color={palette.primary} className="my-4" />
            ) : cards.length === 0 ? (
              <Text className="text-sm text-on-surface-variant">
                {t('payment.noCards')}
              </Text>
            ) : (
              cards.map((c) => (
                <View
                  key={c.id}
                  className="flex-row items-center gap-4 p-4 border border-outline-variant rounded-2xl"
                >
                  <View className="w-12 h-12 rounded-xl bg-surface-container items-center justify-center">
                    <Icon name="credit-card" color={palette.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-on-surface">
                      {cardLabel(c)}
                    </Text>
                    {c.expMonth && c.expYear ? (
                      <Text className="text-xs text-on-surface-variant mt-0.5">
                        {t('payment.expires')} {c.expMonth}/{c.expYear}
                      </Text>
                    ) : null}
                  </View>
                  {busyId === c.id ? (
                    <ActivityIndicator color={palette.error} />
                  ) : (
                    <TouchableOpacity onPress={() => removeCard(c)} className="p-2">
                      <Icon name="delete-outline" color={palette.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}

            {/* Agregar tarjeta */}
            <TouchableOpacity
              onPress={() => setAddVisible(true)}
              disabled={saving}
              activeOpacity={0.85}
              className="flex-row items-center gap-4 p-4 border border-dashed border-outline-variant rounded-2xl"
            >
              <View className="w-12 h-12 rounded-xl bg-surface-container items-center justify-center">
                {saving ? (
                  <ActivityIndicator color={palette.primary} />
                ) : (
                  <Icon name="add" color={palette.primary} />
                )}
              </View>
              <Text className="text-base font-bold text-primary flex-1">
                {saving ? t('payment.saving') : t('payment.addCard')}
              </Text>
            </TouchableOpacity>

            {!!error && (
              <View className="flex-row items-center gap-2 bg-error/10 rounded-xl p-3">
                <Icon name="error-outline" size={18} color={palette.error} />
                <Text className="text-error text-sm flex-1">{error}</Text>
              </View>
            )}

            {/* Efectivo */}
            <Text className="text-sm font-bold text-on-surface-variant mt-3">
              {t('payment.otherMethods')}
            </Text>
            <View className="flex-row items-center gap-4 p-4 border border-outline-variant rounded-2xl">
              <View className="w-12 h-12 rounded-xl bg-surface-container items-center justify-center">
                <Icon name="payments" color={palette.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-on-surface">
                  {t('payment.cashTitle')}
                </Text>
                <Text className="text-xs text-on-surface-variant mt-0.5">
                  {t('payment.cashDesc')}
                </Text>
              </View>
            </View>

            {/* Nota de seguridad */}
            <View className="flex-row items-start gap-3 bg-surface-container rounded-2xl p-4 mt-1">
              <Icon name="lock" size={18} color={palette.primary} />
              <Text className="text-xs text-on-surface-variant flex-1 leading-5">
                {t('payment.securityNote')}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Alta de tarjeta (solo guarda, no cobra) */}
      <OpenpayCardSheet
        visible={addVisible}
        mode="save"
        onClose={() => setAddVisible(false)}
        onToken={onNewToken}
      />
    </Modal>
  );
}
