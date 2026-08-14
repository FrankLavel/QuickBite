import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { useTranslation } from '@/hooks/useTranslation';
import { SavedCard } from '@/types/card.types';

interface Props {
  visible: boolean;
  cards: SavedCard[];
  amountLabel: string;
  onSelect: (cardId: string) => void;
  onNewCard: () => void;
  onClose: () => void;
}

function label(c: SavedCard): string {
  const brand = c.brand
    ? c.brand.charAt(0).toUpperCase() + c.brand.slice(1)
    : 'Tarjeta';
  return `${brand} ···· ${c.cardLast4 ?? '••••'}`;
}

/** Selector de tarjeta guardada en el checkout (pago de un toque) + nueva. */
export function SavedCardPicker({
  visible,
  cards,
  amountLabel,
  onSelect,
  onNewCard,
  onClose,
}: Props) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <SafeAreaView
          edges={['bottom']}
          className="bg-surface-container-lowest rounded-t-3xl max-h-[90%]"
        >
          <View className="flex-row items-center justify-between px-5 pt-5 pb-2">
            <Text className="text-lg font-bold text-on-surface">
              {t('payment.chooseCard')}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-full">
              <Icon name="close" color={palette.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="px-5"
            contentContainerClassName="pb-6 gap-3"
            showsVerticalScrollIndicator={false}
          >
            {cards.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => onSelect(c.id)}
                activeOpacity={0.85}
                className="flex-row items-center gap-4 p-4 border border-outline-variant rounded-2xl"
              >
                <View className="w-12 h-12 rounded-xl bg-surface-container items-center justify-center">
                  <Icon name="credit-card" color={palette.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-on-surface">{label(c)}</Text>
                  {c.expMonth && c.expYear ? (
                    <Text className="text-xs text-on-surface-variant mt-0.5">
                      {t('payment.expires')} {c.expMonth}/{c.expYear}
                    </Text>
                  ) : null}
                </View>
                {c.isDefault ? (
                  <View className="bg-primary-container/20 px-2.5 py-1 rounded-full">
                    <Text className="text-[11px] font-bold text-primary">
                      {t('payment.default')}
                    </Text>
                  </View>
                ) : null}
                <Icon name="chevron-right" color={palette.onSurfaceVariant} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={onNewCard}
              activeOpacity={0.85}
              className="flex-row items-center gap-4 p-4 border border-dashed border-outline-variant rounded-2xl"
            >
              <View className="w-12 h-12 rounded-xl bg-surface-container items-center justify-center">
                <Icon name="add" color={palette.primary} />
              </View>
              <Text className="text-base font-bold text-primary flex-1">
                {t('payment.newCard')}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center gap-2 mt-1">
              <Icon name="lock" size={14} color={palette.onSurfaceVariant} />
              <Text className="text-xs text-on-surface-variant flex-1">
                {t('payment.oneTapNote', { amount: amountLabel })}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
