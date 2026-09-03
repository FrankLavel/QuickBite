import { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Icon } from '@/components/ui/Icon';
import { palette } from '@/constants/colors';
import { config } from '@/constants/config';
import { useTranslation } from '@/hooks/useTranslation';
import { buildTokenizerHtml } from './openpayTokenizer';
import type { OpenpayToken } from '@/services/payments.service';

interface Props {
  visible: boolean;
  /** Total ya formateado, p. ej. "$150.00", para el botón de pago. */
  amountLabel?: string;
  /** 'pay' = cobra (checkout); 'save' = solo guarda (perfil). */
  mode?: 'pay' | 'save';
  /** Muestra el switch "guardar esta tarjeta" (solo en modo 'pay'). */
  showSaveToggle?: boolean;
  onClose: () => void;
  /** Se dispara con el token (y si el usuario pidió guardarla) al validar. */
  onToken: (token: OpenpayToken, saveCard: boolean) => void;
}

const onlyDigits = (s: string) => s.replace(/\D/g, '');
const groups4 = (s: string) => (s.match(/.{1,4}/g) ?? []).join(' ');

/**
 * Hoja de pago con tarjeta. Captura los datos con inputs NATIVOS y usa un
 * WebView "headless" (invisible) solo para tokenizar con Openpay.js. La tarjeta
 * va directo a Openpay; aquí solo se recibe el token + device_session_id.
 */
export function OpenpayCardSheet({
  visible,
  amountLabel = '',
  mode = 'pay',
  showSaveToggle = false,
  onClose,
  onToken,
}: Props) {
  const { t } = useTranslation();

  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cuando != null, se monta el WebView y arranca la tokenización.
  const [html, setHtml] = useState<string | null>(null);

  const rawNumber = onlyDigits(number);
  const valid =
    rawNumber.length >= 15 &&
    rawNumber.length <= 19 &&
    holder.trim().length >= 3 &&
    month.length === 2 &&
    Number(month) >= 1 &&
    Number(month) <= 12 &&
    year.length === 2 &&
    cvv.length >= 3;

  const reset = () => {
    setHtml(null);
  };

  const close = () => {
    reset();
    setError(null);
    onClose();
  };

  const pay = () => {
    if (!valid || html) return;
    setError(null);
    if (!config.openpay.merchantId || !config.openpay.publicKey) {
      setError('Falta configurar Openpay (merchant id / public key).');
      return;
    }
    setHtml(
      buildTokenizerHtml({
        merchantId: config.openpay.merchantId,
        publicKey: config.openpay.publicKey,
        sandbox: config.openpay.sandbox,
        card: {
          card_number: rawNumber,
          holder_name: holder.trim(),
          expiration_month: month,
          expiration_year: year,
          cvv2: cvv,
        },
      })
    );
  };

  const onMessage = (raw: string) => {
    reset();
    let msg: { type?: string; tokenId?: string; deviceSessionId?: string; message?: string };
    try {
      msg = JSON.parse(raw);
    } catch {
      setError('Respuesta inválida al procesar la tarjeta.');
      return;
    }
    if (msg.type === 'token' && msg.tokenId && msg.deviceSessionId) {
      onToken(
        { tokenId: msg.tokenId, deviceSessionId: msg.deviceSessionId },
        mode === 'save' ? true : saveCard
      );
    } else {
      setError(msg.message || 'No se pudo validar la tarjeta.');
    }
  };

  const tokenizing = html !== null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View className="flex-1 bg-black/40 justify-end">
        <SafeAreaView edges={['bottom']} className="bg-surface-container-lowest rounded-t-3xl max-h-[92%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-5 pb-2">
            <View className="flex-row items-center gap-2">
              <Icon name="lock" size={20} color={palette.primary} />
              <Text className="text-lg font-bold text-on-surface">
                {mode === 'save' ? t('payment.addCard') : t('checkout.card')}
              </Text>
            </View>
            <TouchableOpacity onPress={close} className="p-2 rounded-full" disabled={tokenizing}>
              <Icon name="close" color={palette.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="px-5"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Card number */}
            <Text className="text-sm font-semibold text-on-surface-variant mt-3 mb-1">
              {t('payment.cardNumber')}
            </Text>
            <TextInput
              value={groups4(rawNumber)}
              onChangeText={(v) => setNumber(onlyDigits(v).slice(0, 19))}
              placeholder="4111 1111 1111 1111"
              placeholderTextColor={palette.onSurfaceVariant}
              keyboardType="number-pad"
              editable={!tokenizing}
              className="bg-surface-container-low rounded-xl px-4 h-12 text-base text-on-surface"
            />

            {/* Holder */}
            <Text className="text-sm font-semibold text-on-surface-variant mt-4 mb-1">
              {t('payment.holder')}
            </Text>
            <TextInput
              value={holder}
              onChangeText={setHolder}
              placeholder={t('payment.holderPlaceholder')}
              placeholderTextColor={palette.onSurfaceVariant}
              autoCapitalize="characters"
              editable={!tokenizing}
              className="bg-surface-container-low rounded-xl px-4 h-12 text-base text-on-surface"
            />

            {/* Expiry + CVV */}
            <View className="flex-row gap-3 mt-4">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-on-surface-variant mb-1">
                  {t('payment.expiry')}
                </Text>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={month}
                    onChangeText={(v) => setMonth(onlyDigits(v).slice(0, 2))}
                    placeholder="MM"
                    placeholderTextColor={palette.onSurfaceVariant}
                    keyboardType="number-pad"
                    editable={!tokenizing}
                    className="bg-surface-container-low rounded-xl px-4 h-12 text-base text-on-surface w-16 text-center"
                  />
                  <Text className="text-on-surface-variant">/</Text>
                  <TextInput
                    value={year}
                    onChangeText={(v) => setYear(onlyDigits(v).slice(0, 2))}
                    placeholder="YY"
                    placeholderTextColor={palette.onSurfaceVariant}
                    keyboardType="number-pad"
                    editable={!tokenizing}
                    className="bg-surface-container-low rounded-xl px-4 h-12 text-base text-on-surface w-16 text-center"
                  />
                </View>
              </View>
              <View className="w-28">
                <Text className="text-sm font-semibold text-on-surface-variant mb-1">CVV</Text>
                <TextInput
                  value={cvv}
                  onChangeText={(v) => setCvv(onlyDigits(v).slice(0, 4))}
                  placeholder="123"
                  placeholderTextColor={palette.onSurfaceVariant}
                  keyboardType="number-pad"
                  secureTextEntry
                  editable={!tokenizing}
                  className="bg-surface-container-low rounded-xl px-4 h-12 text-base text-on-surface"
                />
              </View>
            </View>

            {!!error && (
              <View className="flex-row items-center gap-2 mt-4 bg-error/10 rounded-xl p-3">
                <Icon name="error-outline" size={18} color={palette.error} />
                <Text className="text-error text-sm flex-1">{error}</Text>
              </View>
            )}

            {/* Guardar esta tarjeta (solo al pagar) */}
            {mode === 'pay' && showSaveToggle && (
              <View className="flex-row items-center justify-between mt-4 bg-surface-container rounded-xl px-4 py-3">
                <View className="flex-row items-center gap-2 flex-1 pr-2">
                  <Icon name="bookmark-border" size={18} color={palette.primary} />
                  <Text className="text-sm text-on-surface flex-1">
                    {t('payment.saveThisCard')}
                  </Text>
                </View>
                <Switch
                  value={saveCard}
                  onValueChange={setSaveCard}
                  disabled={tokenizing}
                  trackColor={{ true: palette.primaryContainer }}
                />
              </View>
            )}

            <View className="flex-row items-center gap-2 mt-4">
              <Icon name="lock" size={14} color={palette.onSurfaceVariant} />
              <Text className="text-xs text-on-surface-variant flex-1">
                {t('payment.secureNote')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={pay}
              disabled={!valid || tokenizing}
              activeOpacity={0.9}
              className="mt-5 mb-6 h-14 bg-primary-container rounded-full flex-row items-center justify-center gap-2"
              style={!valid || tokenizing ? { opacity: 0.5 } : undefined}
            >
              {tokenizing ? (
                <ActivityIndicator color={palette.onPrimaryContainer} />
              ) : (
                <>
                  <Icon
                    name={mode === 'save' ? 'bookmark-border' : 'lock'}
                    color={palette.onPrimaryContainer}
                    size={20}
                  />
                  <Text className="text-on-primary-container font-bold text-lg">
                    {mode === 'save'
                      ? t('payment.saveCard')
                      : `${t('payment.payAmount')} ${amountLabel}`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* WebView headless: solo tokeniza. 0x0, no visible. */}
      {tokenizing && html && (
        <View style={{ width: 0, height: 0 }}>
          <WebView
            originWhitelist={['*']}
            source={{ html, baseUrl: 'https://quickbite.mx' }}
            onMessage={(e) => onMessage(e.nativeEvent.data)}
            javaScriptEnabled
            domStorageEnabled
            onError={() => {
              reset();
              setError('No se pudo cargar el validador de pago. Revisa tu conexión.');
            }}
          />
        </View>
      )}
    </Modal>
  );
}
