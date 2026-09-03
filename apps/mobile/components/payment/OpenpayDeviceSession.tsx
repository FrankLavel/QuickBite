import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { config } from '@/constants/config';
import { buildDeviceSessionHtml } from './openpayTokenizer';

interface Props {
  onReady: (deviceSessionId: string) => void;
  onError: (message: string) => void;
}

/**
 * WebView headless (0x0) que genera un device_session_id de Openpay (antifraude)
 * sin capturar tarjeta. Se monta un instante al cobrar una tarjeta guardada.
 */
export function OpenpayDeviceSession({ onReady, onError }: Props) {
  const html = buildDeviceSessionHtml({
    merchantId: config.openpay.merchantId,
    publicKey: config.openpay.publicKey,
    sandbox: config.openpay.sandbox,
  });

  return (
    <View style={{ width: 0, height: 0 }}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://quickbite.mx' }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg.type === 'device' && msg.deviceSessionId) {
              onReady(msg.deviceSessionId);
            } else {
              onError(msg.message || 'No se pudo preparar el pago.');
            }
          } catch {
            onError('Respuesta inválida al preparar el pago.');
          }
        }}
        onError={() =>
          onError('No se pudo cargar el validador de pago. Revisa tu conexión.')
        }
      />
    </View>
  );
}
