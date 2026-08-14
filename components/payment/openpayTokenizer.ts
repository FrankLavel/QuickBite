/**
 * openpayTokenizer.ts — genera el HTML que corre dentro del WebView para
 * tokenizar la tarjeta con Openpay.js.
 *
 * El WebView es "headless": los datos de la tarjeta se capturan con inputs
 * NATIVOS y se inyectan aquí solo para tokenizar. La tarjeta va directo a
 * Openpay (nunca a nuestro backend); el WebView devuelve únicamente el
 * token + device_session_id vía `window.ReactNativeWebView.postMessage`.
 */

export interface TokenizerCard {
  card_number: string;
  holder_name: string;
  expiration_month: string; // "MM"
  expiration_year: string; // "YY"
  cvv2: string;
}

export interface TokenizerConfig {
  merchantId: string;
  publicKey: string;
  sandbox: boolean;
  card: TokenizerCard;
}

export function buildTokenizerHtml(cfg: TokenizerConfig): string {
  const data = JSON.stringify({
    merchantId: cfg.merchantId,
    publicKey: cfg.publicKey,
    sandbox: cfg.sandbox,
    card: cfg.card,
  });

  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body>
<script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
<script src="https://js.openpay.mx/openpay.v1.min.js"></script>
<script src="https://js.openpay.mx/openpay-data.v1.min.js"></script>
<script>
  var CFG = ${data};
  function post(msg) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }
  }
  function run() {
    try {
      if (typeof OpenPay === 'undefined') {
        return post({ type: 'error', message: 'No se pudo cargar Openpay. Revisa tu conexión e inténtalo de nuevo.' });
      }
      OpenPay.setId(CFG.merchantId);
      OpenPay.setApiKey(CFG.publicKey);
      OpenPay.setSandboxMode(CFG.sandbox);
      var deviceSessionId = OpenPay.deviceData.setup();
      OpenPay.token.create(CFG.card, function (res) {
        post({ type: 'token', tokenId: res.data.id, deviceSessionId: deviceSessionId });
      }, function (err) {
        var d = (err && err.data && err.data.description) ? err.data.description : 'No se pudo validar la tarjeta.';
        post({ type: 'error', message: d });
      });
    } catch (e) {
      post({ type: 'error', message: (e && e.message) || 'Error al procesar la tarjeta.' });
    }
  }
  if (document.readyState === 'complete') { run(); }
  else { window.addEventListener('load', run); }
</script>
</body>
</html>`;
}

/**
 * HTML que SOLO genera un device_session_id (antifraude), sin capturar tarjeta.
 * Se usa para cobrar una tarjeta ya guardada (pago de un toque).
 */
export function buildDeviceSessionHtml(cfg: {
  merchantId: string;
  publicKey: string;
  sandbox: boolean;
}): string {
  const data = JSON.stringify(cfg);
  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body>
<script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
<script src="https://js.openpay.mx/openpay.v1.min.js"></script>
<script src="https://js.openpay.mx/openpay-data.v1.min.js"></script>
<script>
  var CFG = ${data};
  function post(msg) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }
  }
  function run() {
    try {
      if (typeof OpenPay === 'undefined') {
        return post({ type: 'error', message: 'No se pudo cargar Openpay. Revisa tu conexión.' });
      }
      OpenPay.setId(CFG.merchantId);
      OpenPay.setApiKey(CFG.publicKey);
      OpenPay.setSandboxMode(CFG.sandbox);
      var deviceSessionId = OpenPay.deviceData.setup();
      post({ type: 'device', deviceSessionId: deviceSessionId });
    } catch (e) {
      post({ type: 'error', message: (e && e.message) || 'Error de seguridad del pago.' });
    }
  }
  if (document.readyState === 'complete') { run(); }
  else { window.addEventListener('load', run); }
</script>
</body>
</html>`;
}
