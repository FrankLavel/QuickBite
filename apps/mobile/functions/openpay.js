/**
 * openpay.js — cliente REST mínimo de Openpay (MX) para Cloud Functions.
 *
 * No usamos el SDK oficial (antiguo, basado en callbacks): con el `fetch` global
 * de Node 22 y auth Basic (private key como usuario, password vacío) basta.
 *
 * La PRIVATE KEY solo vive aquí (Secret Manager); NUNCA en el cliente.
 * Doc: https://documents.openpay.mx (Cargos → método card con token).
 */

function baseUrl(merchantId, sandbox) {
  const host = sandbox
    ? 'https://sandbox-api.openpay.mx'
    : 'https://api.openpay.mx';
  return `${host}/v1/${merchantId}`;
}

/**
 * Llama a la API de Openpay. Devuelve el JSON de respuesta. Si el status HTTP
 * no es 2xx, lanza un Error con `.openpay` = cuerpo de error de Openpay
 * ({ category, error_code, description, http_code, request_id }).
 */
async function openpayRequest(path, opts) {
  const { method = 'GET', body, merchantId, privateKey, sandbox = true } = opts;
  const url = `${baseUrl(merchantId, sandbox)}${path}`;
  const auth = Buffer.from(`${privateKey}:`).toString('base64');

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const err = new Error(data.description || `Openpay HTTP ${res.status}`);
    err.openpay = data;
    err.httpStatus = res.status;
    throw err;
  }
  return data;
}

/**
 * Crea un cargo con tarjeta a nivel comercio usando un token de Openpay.js.
 * amount va en la moneda (MXN) con decimales (ej. 150.00).
 */
async function createCardCharge(cfg, params) {
  const { merchantId, privateKey, sandbox } = cfg;
  const {
    amount,
    currency = 'MXN',
    tokenId,
    deviceSessionId,
    description,
    orderId,
    customer,
  } = params;

  return openpayRequest('/charges', {
    method: 'POST',
    merchantId,
    privateKey,
    sandbox,
    body: {
      method: 'card',
      source_id: tokenId,
      amount,
      currency,
      description,
      device_session_id: deviceSessionId,
      // order_id debe ser único por comercio: usamos el id del pedido de Firestore.
      order_id: orderId,
      // 3D Secure diferido (fase 2). En sandbox se cobra sin desafío.
      use_3d_secure: false,
      ...(customer ? { customer } : {}),
    },
  });
}

/** Reembolsa un cargo (best-effort). Usado si falla la escritura tras cobrar. */
async function refundCharge(cfg, chargeId, description) {
  const { merchantId, privateKey, sandbox } = cfg;
  return openpayRequest(`/charges/${chargeId}/refund`, {
    method: 'POST',
    merchantId,
    privateKey,
    sandbox,
    body: { description: description || 'Reverso automático' },
  });
}

/** Consulta un cargo por id (usado por el webhook para reconciliar). */
async function getCharge(cfg, chargeId) {
  const { merchantId, privateKey, sandbox } = cfg;
  return openpayRequest(`/charges/${chargeId}`, {
    merchantId,
    privateKey,
    sandbox,
  });
}

// ---------------------------------------------------------------------------
//   CLIENTES + TARJETAS GUARDADAS (bóveda de Openpay; el PAN nunca es nuestro)
// ---------------------------------------------------------------------------

/** Crea un cliente en Openpay. name/email requeridos. Devuelve el cliente. */
async function createCustomer(cfg, { name, email }) {
  const { merchantId, privateKey, sandbox } = cfg;
  return openpayRequest('/customers', {
    method: 'POST',
    merchantId,
    privateKey,
    sandbox,
    body: { name, email, requires_account: false },
  });
}

/** Guarda una tarjeta (desde un token) en un cliente. Devuelve la tarjeta. */
async function createCustomerCard(cfg, customerId, { tokenId, deviceSessionId }) {
  const { merchantId, privateKey, sandbox } = cfg;
  return openpayRequest(`/customers/${customerId}/cards`, {
    method: 'POST',
    merchantId,
    privateKey,
    sandbox,
    body: { token_id: tokenId, device_session_id: deviceSessionId },
  });
}

/** Elimina una tarjeta guardada de un cliente. */
async function deleteCustomerCard(cfg, customerId, cardId) {
  const { merchantId, privateKey, sandbox } = cfg;
  return openpayRequest(`/customers/${customerId}/cards/${cardId}`, {
    method: 'DELETE',
    merchantId,
    privateKey,
    sandbox,
  });
}

/**
 * Cobra una tarjeta YA guardada de un cliente (source_id = card_id).
 * amount en MXN con decimales.
 */
async function chargeCustomerCard(cfg, customerId, params) {
  const { merchantId, privateKey, sandbox } = cfg;
  const { amount, currency = 'MXN', cardId, deviceSessionId, description, orderId } = params;
  return openpayRequest(`/customers/${customerId}/charges`, {
    method: 'POST',
    merchantId,
    privateKey,
    sandbox,
    body: {
      method: 'card',
      source_id: cardId,
      amount,
      currency,
      description,
      device_session_id: deviceSessionId,
      order_id: orderId,
      use_3d_secure: false,
    },
  });
}

module.exports = {
  openpayRequest,
  createCardCharge,
  refundCharge,
  getCharge,
  createCustomer,
  createCustomerCard,
  deleteCustomerCard,
  chargeCustomerCard,
};
