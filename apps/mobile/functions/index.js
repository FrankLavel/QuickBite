const {
  onDocumentUpdated,
  onDocumentCreated,
  onDocumentWritten,
} = require('firebase-functions/v2/firestore');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineString, defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const openpay = require('./openpay');
const webpush = require('web-push');

initializeApp();
const db = getFirestore();

// --- Configuración Openpay ---------------------------------------------------
// No sensibles (el merchant id también vive en el cliente para tokenizar):
const OPENPAY_MERCHANT_ID = defineString('OPENPAY_MERCHANT_ID');
const OPENPAY_SANDBOX = defineString('OPENPAY_SANDBOX', { default: 'true' });
// Sensibles (Secret Manager): `firebase functions:secrets:set OPENPAY_PRIVATE_KEY`
const OPENPAY_PRIVATE_KEY = defineSecret('OPENPAY_PRIVATE_KEY');
const OPENPAY_WEBHOOK_USER = defineSecret('OPENPAY_WEBHOOK_USER');
const OPENPAY_WEBHOOK_PASS = defineSecret('OPENPAY_WEBHOOK_PASS');

const openpayCfg = () => ({
  merchantId: OPENPAY_MERCHANT_ID.value(),
  privateKey: OPENPAY_PRIVATE_KEY.value(),
  sandbox: OPENPAY_SANDBOX.value() !== 'false',
});

// --- Web Push (VAPID) para el dashboard del restaurante ----------------------
// La public key y el subject no son sensibles (env). La PRIVATE key va en Secret
// Manager: `firebase functions:secrets:set VAPID_PRIVATE_KEY` (F14).
const VAPID_PUBLIC_KEY = defineString('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = defineSecret('VAPID_PRIVATE_KEY');
const VAPID_SUBJECT = defineString('VAPID_SUBJECT', {
  default: 'mailto:no-reply@quickbite.app',
});

// Mensaje al cliente por cada estado (debe coincidir con lib/orderStatus.ts).
const STATUS_MESSAGE = {
  accepted: 'Pedido confirmado, en preparación',
  preparing: 'Tu pedido está en cocina',
  ready: 'Tu pedido está listo para envío',
  on_the_way: 'Tu pedido está en camino',
  delivered: 'Pedido entregado — califica tu pedido',
  rejected: 'Tu pedido fue rechazado',
  cancelled: 'Cancelaste este pedido',
};

/**
 * Envía mensajes push por Expo en lotes de 100 (límite de la API). Best-effort:
 * registra los fallos sin lanzar. Acepta un mensaje o un array (F12).
 */
async function sendExpoPush(messages) {
  const list = (Array.isArray(messages) ? messages : [messages]).filter((m) => m && m.to);
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100);
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        console.error('Expo push falló', res.status, await res.text());
      }
    } catch (e) {
      console.error('Expo push error de red', e && e.message);
    }
  }
}

/**
 * Al cambiar el status de un pedido: crea la notificación en Firestore
 * (la app la lee en tiempo real) y envía una push al token Expo del cliente.
 */
exports.onOrderStatusChange = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.status === after.status) return;

  const message = STATUS_MESSAGE[after.status];
  if (!message) return;

  const customerId = after.customerId;
  const orderId = event.params.orderId;
  if (!customerId) return;

  // 1) Notificación en Firestore (pantalla de notificaciones en tiempo real).
  await db
    .collection('users')
    .doc(customerId)
    .collection('notifications')
    .add({
      type: 'order_update',
      title: 'Actualización de tu pedido',
      body: message,
      orderId,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    });

  // 2) Push al token Expo del cliente (si lo tiene registrado).
  const userSnap = await db.collection('users').doc(customerId).get();
  const pushToken = userSnap.get('pushToken');
  if (!pushToken) {
    console.warn(`Sin pushToken para el usuario ${customerId}; no se envía push.`);
    return;
  }
  console.log(`Enviando push a ${customerId} (${pushToken.slice(0, 20)}...)`);

  await sendExpoPush([
    {
      to: pushToken,
      sound: 'default',
      title: 'QuickBite',
      body: message,
      data: { orderId },
      channelId: 'default',
    },
  ]);
});

/**
 * Cuando un pedido pasa a 'ready' sin repartidor, avisa por push a los
 * repartidores disponibles (rol 'driver', isAvailable != false y con pushToken)
 * de que hay un pedido para reclamar. Modelo auto-servicio (app QuickBite Driver).
 */
exports.notifyDriversOnReady = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.status === after.status) return; // solo en transiciones
  if (after.status !== 'ready') return;
  if (after.driverId) return; // ya tiene repartidor

  const driversSnap = await db
    .collection('users')
    .where('role', '==', 'driver')
    .get();

  const tokens = driversSnap.docs
    .filter((d) => d.get('isAvailable') !== false && d.get('pushToken'))
    .map((d) => d.get('pushToken'));

  if (tokens.length === 0) return;

  const orderId = event.params.orderId;
  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title: 'Nuevo pedido disponible',
    body: 'Hay un pedido listo para recoger. ¡Reclámalo!',
    data: { type: 'available_order', orderId },
    channelId: 'default',
  }));

  await sendExpoPush(messages);
});

/**
 * Mantiene la proyección REDACTADA de pedidos disponibles para repartidores:
 * availableOrders/{orderId} con datos gruesos (sin PII del cliente). Existe solo
 * mientras el pedido está 'ready' y sin repartidor. Así el repartidor decide sin
 * ver nombre/teléfono/dirección del cliente hasta que reclama el pedido (H1).
 */
exports.syncAvailableOrders = onDocumentWritten('orders/{orderId}', async (event) => {
  const after = event.data?.after.data();
  const orderId = event.params.orderId;
  const availRef = db.collection('availableOrders').doc(orderId);

  const isAvailable = !!after && after.status === 'ready' && !after.driverId;
  if (!isAvailable) {
    await availRef.delete().catch(() => {});
    return;
  }

  let restaurantName = '';
  try {
    const r = await db.collection('restaurants').doc(after.restaurantId).get();
    restaurantName = r.get('name') || '';
  } catch (e) {
    // sin nombre si no se pudo leer
  }
  const itemCount = Array.isArray(after.items)
    ? after.items.reduce((n, it) => n + (Number(it.qty) || 0), 0)
    : 0;

  await availRef.set({
    orderId,
    restaurantId: after.restaurantId || '',
    restaurantName,
    city: (after.deliveryAddress && after.deliveryAddress.city) || '',
    total: Number(after.total) || 0,
    itemCount,
    orderCreatedAt: after.createdAt || FieldValue.serverTimestamp(),
  });
});

/**
 * Al reclamar un pedido (driverId pasa de vacío a asignado), denormaliza el
 * nombre y teléfono REALES del repartidor desde su perfil (H2): así el cliente y
 * el restaurante ven datos de contacto verificados, no los que escriba el driver.
 */
exports.denormalizeDriverOnClaim = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.driverId || !after.driverId) return; // solo en la transición de reclamo

  const driverSnap = await db.collection('users').doc(after.driverId).get();
  if (!driverSnap.exists) return;

  await event.data.after.ref.update({
    driverName: driverSnap.get('name') || 'Repartidor',
    driverPhone: driverSnap.get('phone') || '',
  });
});

/**
 * Al crear un pedido, avisa por Web Push al restaurante dueño (dashboard PWA),
 * para alertarlo aunque tenga la pestaña cerrada. La suscripción se guarda en
 * users/{uid}.webPushSubscription desde el dashboard.
 */
exports.notifyRestaurantOnNewOrder = onDocumentCreated(
  { document: 'orders/{orderId}', secrets: [VAPID_PRIVATE_KEY] },
  async (event) => {
  const order = event.data?.data();
  if (!order || !order.restaurantId) return;

  // Usuario dueño del restaurante (query por restaurantId, sin índice compuesto).
  const snap = await db
    .collection('users')
    .where('restaurantId', '==', order.restaurantId)
    .get();
  const restUser = snap.docs.find((d) => d.get('role') === 'restaurant');
  if (!restUser) return;

  const sub = restUser.get('webPushSubscription');
  if (!sub || !sub.endpoint) return;

  const publicKey = VAPID_PUBLIC_KEY.value();
  const privateKey = VAPID_PRIVATE_KEY.value();
  if (!publicKey || !privateKey) {
    console.warn('VAPID no configurado; no se envía Web Push.');
    return;
  }
  webpush.setVapidDetails(VAPID_SUBJECT.value(), publicKey, privateKey);

  const shortId = event.params.orderId.slice(0, 6).toUpperCase();
  const payload = JSON.stringify({
    title: 'Nuevo pedido',
    body: `Tienes un pedido nuevo #${shortId}`,
    data: { url: '/', orderId: event.params.orderId },
  });

  try {
    await webpush.sendNotification(sub, payload);
  } catch (err) {
    // 404/410 = suscripción expirada: se limpia.
    if (err && (err.statusCode === 404 || err.statusCode === 410)) {
      await restUser.ref.update({ webPushSubscription: FieldValue.delete() });
    } else {
      console.error('Web Push falló', err?.statusCode, err?.body);
    }
  }
});

/**
 * Al crear un usuario CLIENTE: notificación de bienvenida (categoría "Sistema").
 */
exports.onUserCreated = onDocumentCreated('users/{uid}', async (event) => {
  const data = event.data?.data();
  if (!data || data.role !== 'customer') return;
  const uid = event.params.uid;

  await db
    .collection('users')
    .doc(uid)
    .collection('notifications')
    .add({
      type: 'system',
      title: '¡Bienvenido a QuickBite!',
      body: 'Explora restaurantes cerca de ti y haz tu primer pedido.',
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    });
});

/**
 * Al publicar una oferta: avisa (categoría "Promos") a los clientes que tienen
 * ese restaurante en favoritos Y que ya han consumido ahí (tienen pedidos).
 */
exports.onOfferCreated = onDocumentCreated('offers/{offerId}', async (event) => {
  const offer = event.data?.data();
  if (!offer || offer.isActive === false) return;
  const restaurantId = offer.restaurantId;
  if (!restaurantId) return;

  // Nombre del restaurante para el mensaje.
  const restSnap = await db.collection('restaurants').doc(restaurantId).get();
  const restName = restSnap.get('name') || 'tu restaurante favorito';

  // 1) Clientes que tienen el restaurante en favoritos.
  const favSnap = await db
    .collection('users')
    .where('favoriteIds', 'array-contains', restaurantId)
    .get();
  const favUids = new Set(favSnap.docs.map((d) => d.id));
  if (favUids.size === 0) return;

  // 2) Clientes que ya consumieron ahí (tienen pedidos en ese restaurante).
  const ordersSnap = await db
    .collection('orders')
    .where('restaurantId', '==', restaurantId)
    .get();
  const consumerUids = new Set(
    ordersSnap.docs.map((d) => d.get('customerId')).filter(Boolean)
  );

  // Objetivo: favoritos ∩ consumidores.
  const targets = [...favUids].filter((uid) => consumerUids.has(uid));
  if (targets.length === 0) return;

  const title = `Nueva promo en ${restName}`;
  const body =
    offer.title || offer.badge || 'Tienes una nueva oferta disponible';

  // Notificación en Firestore para cada objetivo + push en LOTE (F12): se leen
  // los perfiles en un solo getAll y los push salen en lotes de 100.
  const targetSnaps = await db.getAll(
    ...targets.map((uid) => db.collection('users').doc(uid))
  );
  const pushMessages = [];
  await Promise.all(
    targetSnaps.map((uSnap) => {
      const token = uSnap.get('pushToken');
      if (token) {
        pushMessages.push({
          to: token,
          sound: 'default',
          title: 'QuickBite',
          body: `${title} — ${body}`,
          channelId: 'default',
        });
      }
      return db
        .collection('users')
        .doc(uSnap.id)
        .collection('notifications')
        .add({
          type: 'promo',
          title,
          body,
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
        });
    })
  );
  await sendExpoPush(pushMessages);
});

/**
 * submitReview — Callable. Crea/edita la reseña de un platillo SOLO si el usuario
 * tiene un pedido 'delivered' propio que INCLUYE ese producto (compra verificada
 * de verdad). Las Security Rules no pueden recorrer items[], así que esta
 * validación vive aquí; las reglas bloquean la escritura directa del cliente (F7).
 *
 * data: { restaurantId, productId, rating, comment } -> { ok: true }
 */
exports.submitReview = onCall({ region: 'us-central1' }, async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Inicia sesión para reseñar.');

  const { restaurantId, productId } = request.data || {};
  const rating = Number(request.data && request.data.rating);
  const comment = String((request.data && request.data.comment) || '');
  if (!restaurantId || !productId) {
    throw new HttpsError('invalid-argument', 'Falta el producto a reseñar.');
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpsError('invalid-argument', 'La calificación debe ser un entero de 1 a 5.');
  }
  if (comment.length > 1000) {
    throw new HttpsError('invalid-argument', 'El comentario es demasiado largo.');
  }

  // Compra verificada: un pedido 'delivered' del usuario, de ese restaurante, que
  // contenga el producto. (where solo por customerId: no requiere índice compuesto.)
  const ordersSnap = await db
    .collection('orders')
    .where('customerId', '==', uid)
    .get();
  const backing = ordersSnap.docs.find(
    (d) =>
      d.get('status') === 'delivered' &&
      d.get('restaurantId') === restaurantId &&
      Array.isArray(d.get('items')) &&
      d.get('items').some((it) => it && it.productId === productId)
  );
  if (!backing) {
    throw new HttpsError(
      'failed-precondition',
      'Solo puedes reseñar un platillo que hayas recibido en un pedido entregado.'
    );
  }

  // Nombre/foto reales desde el perfil (no se confía en el cliente).
  const userSnap = await db.collection('users').doc(uid).get();
  const userName = userSnap.get('name') || 'Cliente';
  const userPhotoURL = userSnap.get('photoURL') || null;

  await db
    .collection('restaurants')
    .doc(restaurantId)
    .collection('products')
    .doc(productId)
    .collection('reviews')
    .doc(uid)
    .set({
      userId: uid,
      userName,
      ...(userPhotoURL ? { userPhotoURL } : {}),
      orderId: backing.id,
      rating,
      comment: comment.trim(),
      createdAt: FieldValue.serverTimestamp(),
    });

  return { ok: true };
});

/**
 * Al escribir (crear/editar/borrar) una reseña de platillo, recalcula:
 *  - product.rating / reviewCount = promedio de las reseñas del platillo.
 *  - restaurant.rating = promedio de las calificaciones de sus platillos
 *    calificados; restaurant.reviewCount = total de reseñas del restaurante.
 */
exports.onReviewWritten = onDocumentWritten(
  'restaurants/{restId}/products/{prodId}/reviews/{userId}',
  async (event) => {
    const { restId, prodId } = event.params;
    const productRef = db
      .collection('restaurants')
      .doc(restId)
      .collection('products')
      .doc(prodId);

    // 1) Promedio del PLATILLO a partir de todas sus reseñas.
    const reviewsSnap = await productRef.collection('reviews').get();
    const ratings = reviewsSnap.docs
      .map((d) => d.get('rating'))
      .filter((r) => typeof r === 'number');
    const prodCount = ratings.length;
    const prodAvg =
      prodCount > 0 ? ratings.reduce((s, r) => s + r, 0) / prodCount : 0;

    await productRef.set(
      { rating: Math.round(prodAvg * 10) / 10, reviewCount: prodCount },
      { merge: true }
    );

    // 2) Promedio del RESTAURANTE = promedio de las calificaciones de sus
    //    platillos con reseñas. reviewCount = total de reseñas del restaurante.
    const productsSnap = await db
      .collection('restaurants')
      .doc(restId)
      .collection('products')
      .get();
    const rated = productsSnap.docs
      .map((d) => ({
        rating: d.get('rating'),
        count: d.get('reviewCount') || 0,
      }))
      .filter((p) => typeof p.rating === 'number' && p.count > 0);
    const restAvg =
      rated.length > 0
        ? rated.reduce((s, p) => s + p.rating, 0) / rated.length
        : 0;
    const restCount = rated.reduce((s, p) => s + p.count, 0);

    await db
      .collection('restaurants')
      .doc(restId)
      .set(
        { rating: Math.round(restAvg * 10) / 10, reviewCount: restCount },
        { merge: true }
      );
  }
);

// ============================================================================
//                              PAGOS — OPENPAY
// ============================================================================

const round2 = (n) => Math.round(n * 100) / 100;

/** ¿La oferta está activa y dentro de su ventana? (mirror de offers.service.ts) */
function offerVisible(o) {
  if (!o || !o.isActive) return false;
  const now = Date.now();
  const start = o.startsAt && o.startsAt.toMillis ? o.startsAt.toMillis() : undefined;
  const end = o.endsAt && o.endsAt.toMillis ? o.endsAt.toMillis() : undefined;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

/** Promo de la oferta de platillo activa para un producto (mirror de lib/promo.ts). */
function offerPromoFor(offers, restaurantId, productId) {
  const offer = offers.find(
    (o) =>
      o.type === 'dish' &&
      o.restaurantId === restaurantId &&
      o.productId === productId &&
      !!o.discountKind
  );
  if (!offer) return null;
  if (offer.discountKind === '2x1') return { kind: '2x1' };
  if (offer.discountKind === 'percent' && (offer.discountPercent || 0) > 0) {
    return { kind: 'percent', percent: offer.discountPercent };
  }
  return null;
}

/** Subtotal de una línea aplicando su promo (mirror de lib/promo.ts lineSubtotal). */
function lineSubtotalServer(unit, qty, promo) {
  const base = unit * qty;
  if (!promo) return base;
  if (promo.kind === 'percent') {
    const pct = Math.min(Math.max(promo.percent, 0), 100);
    return base * (1 - pct / 100);
  }
  return unit * Math.ceil(qty / 2); // 2x1: se pagan ceil(qty/2) unidades
}

/**
 * Toppings legítimos de un producto como pares {name, price}. El cliente trata
 * product.toppings como add-ons planos a nivel de grupo (name + price), así que
 * se valida contra ese nivel (ver app/product/[id].tsx).
 */
function toppingPricesFor(product) {
  return (Array.isArray(product.toppings) ? product.toppings : []).map((t) => ({
    name: t.name,
    price: Number(t.price) || 0,
  }));
}

/**
 * Recalcula los montos del pedido EN EL SERVIDOR desde el precio REAL de cada
 * producto (nunca el que manda el cliente): base + toppings validados contra el
 * catálogo del platillo, promos tomadas de las ofertas vigentes, deliveryFee del
 * restaurante y cupón revalidado. Cierra la manipulación de precios/promo/total
 * en ambos flujos de pago (F16). Devuelve { subtotal, deliveryFee, discount,
 * total, couponCode }.
 */
async function computeOrderTotals(input) {
  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length === 0) {
    throw new HttpsError('invalid-argument', 'El pedido no tiene productos.');
  }
  const restaurantId = input.restaurantId;

  // deliveryFee real del restaurante.
  const restSnap = await db.collection('restaurants').doc(restaurantId).get();
  if (!restSnap.exists) {
    throw new HttpsError('not-found', 'Restaurante no encontrado.');
  }
  const deliveryFee = Number(restSnap.get('deliveryFee')) || 0;

  // Ofertas de platillo VIGENTES del restaurante: la promo se toma de aquí, no de
  // lo que envíe el cliente (evita inventar un 100% off).
  const offersSnap = await db
    .collection('offers')
    .where('restaurantId', '==', restaurantId)
    .get();
  const offers = offersSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter(offerVisible);

  // Precios REALES de los productos del pedido (una sola lectura por lote).
  const productRefs = items.map((it) =>
    db
      .collection('restaurants')
      .doc(restaurantId)
      .collection('products')
      .doc(String(it.productId))
  );
  const productSnaps = await db.getAll(...productRefs);
  const productById = {};
  productSnaps.forEach((s) => {
    if (s.exists) productById[s.id] = s.data();
  });

  // Subtotal recomputado: base real + toppings validados (nombre + precio del
  // catálogo) y la promo autoritativa. Un precio/topping/promo alterado rechaza
  // el pedido; nunca se confía en el `price`/`promo` del cliente.
  let subtotal = 0;
  for (const it of items) {
    const qty = Number(it.qty);
    if (!(qty > 0)) {
      throw new HttpsError('invalid-argument', 'Cantidad de producto inválida.');
    }
    const product = productById[String(it.productId)];
    if (!product) {
      throw new HttpsError('invalid-argument', 'Un producto del pedido no existe.');
    }
    if (product.isAvailable === false) {
      throw new HttpsError('failed-precondition', `"${product.name}" ya no está disponible.`);
    }

    const allowed = toppingPricesFor(product);
    let unit = Number(product.price) || 0;
    for (const t of Array.isArray(it.toppings) ? it.toppings : []) {
      const match = allowed.find(
        (a) => a.name === t.name && round2(a.price) === round2(Number(t.price))
      );
      if (!match) {
        throw new HttpsError('invalid-argument', 'Personalización inválida en el pedido.');
      }
      unit += match.price;
    }

    const promo = offerPromoFor(offers, restaurantId, String(it.productId));
    subtotal += round2(lineSubtotalServer(unit, qty, promo));
  }
  subtotal = round2(subtotal);

  // Descuento por cupón (revalidado contra Firestore).
  let discount = 0;
  let couponCode = null;
  if (input.couponCode) {
    const cSnap = await db.collection('coupons').doc(input.couponCode).get();
    if (cSnap.exists) {
      const c = cSnap.data();
      const notExpired = !c.expiresAt || c.expiresAt.toMillis() > Date.now();
      const usable =
        c.restaurantId === input.restaurantId &&
        c.isActive &&
        notExpired &&
        c.usedCount < c.maxUses &&
        subtotal >= c.minOrder;
      if (usable) {
        const raw = c.type === 'percent' ? (subtotal * c.value) / 100 : c.value;
        discount = round2(Math.min(raw, subtotal));
        couponCode = cSnap.id;
      }
    }
  }

  const total = Math.max(0, round2(subtotal + deliveryFee - discount));
  return { subtotal, deliveryFee, discount, total, couponCode };
}

/** Mapea un error de Openpay a un HttpsError con mensaje amigable en español. */
function openpayError(e) {
  const op = e && e.openpay;
  // Códigos de tarjeta declinada / fondos: 3001-3005, etc.
  const msgByCode = {
    3001: 'La tarjeta fue declinada.',
    3002: 'La tarjeta ha expirado.',
    3003: 'Fondos insuficientes.',
    3004: 'La tarjeta fue reportada como robada.',
    3005: 'La tarjeta fue rechazada por el sistema antifraude.',
    3009: 'La tarjeta fue reportada como perdida.',
    3010: 'El banco restringió la tarjeta.',
  };
  const friendly =
    (op && (msgByCode[op.error_code] || op.description)) ||
    'No se pudo procesar el pago. Intenta con otra tarjeta.';
  return new HttpsError('aborted', friendly, {
    error_code: op && op.error_code,
    category: op && op.category,
  });
}

/** Lee el customerId de Openpay guardado en users/{uid} (o null). */
async function getOpenpayCustomerId(uid) {
  const snap = await db.collection('users').doc(uid).get();
  return snap.get('openpayCustomerId') || null;
}

/** Obtiene (o crea) el cliente Openpay del usuario y lo guarda en users/{uid}. */
async function getOrCreateOpenpayCustomer(uid, name, email) {
  const existing = await getOpenpayCustomerId(uid);
  if (existing) return existing;
  const customer = await openpay.createCustomer(openpayCfg(), {
    name: name || 'Cliente QuickBite',
    // Openpay exige email con formato válido; si el usuario no tiene, uno estable.
    email: email || `qb-${uid}@quickbite.mx`,
  });
  await db.collection('users').doc(uid).set(
    { openpayCustomerId: customer.id },
    { merge: true }
  );
  return customer.id;
}

/** Guarda los metadatos (no el PAN) de una tarjeta en users/{uid}/cards/{cardId}. */
async function writeSavedCard(uid, card) {
  const cardsCol = db.collection('users').doc(uid).collection('cards');
  const first = await cardsCol.limit(1).get();
  const num = card.card_number || '';
  await cardsCol.doc(card.id).set({
    openpayCardId: card.id,
    brand: card.brand || null,
    cardLast4: num ? num.slice(-4) : null,
    expMonth: card.expiration_month || null,
    expYear: card.expiration_year || null,
    holderName: card.holder_name || null,
    isDefault: first.empty, // la primera tarjeta queda como predeterminada
    createdAt: FieldValue.serverTimestamp(),
  });
}

/**
 * createCardCharge — Callable. Cobra con tarjeta vía Openpay y, SOLO si el
 * cargo es exitoso, crea el pedido (paymentStatus:'paid') e incrementa el
 * cupón, todo con el Admin SDK (salta las Security Rules).
 *
 * data: { orderInput: NewOrderInput, tokenId, deviceSessionId }
 * return: { orderId, chargeId }
 */
exports.createCardCharge = onCall(
  {
    region: 'us-central1',
    secrets: [OPENPAY_PRIVATE_KEY],
  },
  async (request) => {
    const uid = request.auth && request.auth.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Inicia sesión para pagar.');
    }

    const {
      orderInput,
      tokenId,
      deviceSessionId,
      orderId: clientOrderId,
      savedCardId,
      saveCard,
    } = request.data || {};
    if (!orderInput || !deviceSessionId) {
      throw new HttpsError('invalid-argument', 'Faltan datos del pago.');
    }
    if (!tokenId && !savedCardId) {
      throw new HttpsError('invalid-argument', 'Falta la tarjeta.');
    }
    if (!orderInput.restaurantId) {
      throw new HttpsError('invalid-argument', 'Falta el restaurante.');
    }

    // 1) Id del pedido: usamos el que manda el cliente (estable entre reintentos
    //    del mismo checkout) para ser idempotentes; si no viene, generamos uno.
    //    También es el order_id en Openpay.
    const orderRef = clientOrderId
      ? db.collection('orders').doc(String(clientOrderId))
      : db.collection('orders').doc();
    const orderId = orderRef.id;

    // Idempotencia anti-doble-cobro: si ese pedido ya existe y está pagado (un
    // intento previo sí concretó pero la respuesta no llegó al cliente), lo
    // devolvemos sin volver a cobrar.
    const existing = await orderRef.get();
    if (existing.exists) {
      if (existing.get('customerId') !== uid) {
        throw new HttpsError('invalid-argument', 'Identificador de pedido inválido.');
      }
      if (existing.get('paymentStatus') === 'paid') {
        return { orderId, chargeId: existing.get('openpayChargeId') || null };
      }
      throw new HttpsError('aborted', 'Este pedido ya está en proceso. Revisa tus pedidos.');
    }

    // 2) Montos recalculados en el servidor (fuente de verdad del cobro).
    const totals = await computeOrderTotals(orderInput);
    if (totals.total <= 0) {
      throw new HttpsError('failed-precondition', 'El total a cobrar es inválido.');
    }

    // 3) Cargo en Openpay. Tres modos:
    //    a) savedCardId  -> cobra una tarjeta ya guardada del cliente.
    //    b) tokenId+save -> guarda la tarjeta en el cliente y cobra esa tarjeta.
    //    c) tokenId      -> cargo de un solo uso a nivel comercio (no se guarda).
    const desc = `QuickBite pedido ${orderId}`;
    let charge;
    let newCardMeta = null;
    try {
      if (savedCardId) {
        const customerId = await getOpenpayCustomerId(uid);
        if (!customerId) {
          throw new HttpsError('failed-precondition', 'No tienes tarjetas guardadas.');
        }
        charge = await openpay.chargeCustomerCard(openpayCfg(), customerId, {
          amount: totals.total,
          cardId: savedCardId,
          deviceSessionId,
          orderId,
          description: desc,
        });
      } else if (saveCard) {
        // El token es de un solo uso: se crea la tarjeta en el cliente y se
        // cobra esa tarjeta (así queda guardada para la próxima compra).
        const customerId = await getOrCreateOpenpayCustomer(
          uid,
          orderInput.customerName,
          request.auth.token.email
        );
        newCardMeta = await openpay.createCustomerCard(openpayCfg(), customerId, {
          tokenId,
          deviceSessionId,
        });
        charge = await openpay.chargeCustomerCard(openpayCfg(), customerId, {
          amount: totals.total,
          cardId: newCardMeta.id,
          deviceSessionId,
          orderId,
          description: desc,
        });
      } else {
        charge = await openpay.createCardCharge(openpayCfg(), {
          amount: totals.total,
          currency: 'MXN',
          tokenId,
          deviceSessionId,
          orderId,
          description: desc,
          customer: {
            name: orderInput.customerName || 'Cliente QuickBite',
            email: request.auth.token.email || 'sin-correo@quickbite.mx',
          },
        });
      }
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      console.error('Openpay charge falló', e.openpay || e.message);
      throw openpayError(e);
    }

    // Openpay: 'completed' = cobrado; otro estado no lo damos por pagado.
    if (charge.status !== 'completed') {
      console.warn('Cargo Openpay no completado', charge.id, charge.status);
      throw new HttpsError('aborted', 'El pago no se completó. Intenta de nuevo.');
    }

    // 4) Crear el pedido pagado + incrementar cupón (batch atómico).
    const cardNumber = (charge.card && charge.card.card_number) || '';
    const orderDoc = {
      customerId: uid, // desde auth, nunca del cliente
      restaurantId: orderInput.restaurantId,
      items: orderInput.items,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      discount: totals.discount,
      total: totals.total,
      deliveryAddress: orderInput.deliveryAddress,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      paymentProvider: 'openpay',
      openpayChargeId: charge.id,
      cardBrand: (charge.card && charge.card.brand) || null,
      cardLast4: cardNumber ? cardNumber.slice(-4) : null,
      couponCode: totals.couponCode,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      paidAt: FieldValue.serverTimestamp(),
      ...(orderInput.customerName ? { customerName: orderInput.customerName } : {}),
      ...(orderInput.customerPhone ? { customerPhone: orderInput.customerPhone } : {}),
      ...(orderInput.specialInstructions
        ? { specialInstructions: orderInput.specialInstructions }
        : {}),
    };

    try {
      const batch = db.batch();
      batch.set(orderRef, orderDoc);
      if (totals.couponCode) {
        batch.update(db.collection('coupons').doc(totals.couponCode), {
          usedCount: FieldValue.increment(1),
        });
      }
      await batch.commit();
    } catch (e) {
      // Se cobró pero no se pudo guardar el pedido: reversamos para no dejar
      // un cargo huérfano y devolvemos error.
      console.error('Fallo al guardar el pedido tras cobrar; reversando', e);
      try {
        await openpay.refundCharge(openpayCfg(), charge.id, 'Reverso: pedido no guardado');
      } catch (re) {
        console.error('Reverso Openpay falló (revisar manualmente)', charge.id, re);
      }
      throw new HttpsError('internal', 'No se pudo registrar el pedido. Se revirtió el cobro.');
    }

    // Si se guardó una tarjeta nueva durante el pago, registra sus metadatos
    // (best-effort; la tarjeta ya quedó en la bóveda de Openpay).
    if (newCardMeta) {
      try {
        await writeSavedCard(uid, newCardMeta);
      } catch (e) {
        console.error('No se guardó la metadata de la tarjeta', e);
      }
    }

    return { orderId, chargeId: charge.id };
  }
);

/**
 * createCashOrder — Callable. Crea un pedido en EFECTIVO recalculando los montos
 * EN EL SERVIDOR (nunca se confía en el total/descuento/tarifa/cupón que manda el
 * cliente) y consumiendo el cupón en el mismo batch atómico, todo con el Admin SDK
 * (salta las Security Rules). Con esto el cliente ya NO crea pedidos ni incrementa
 * cupones directamente: las reglas de `orders` (create) y `coupons` (update) quedan
 * cerradas al cliente (F2/F3).
 *
 * data: { orderInput: NewOrderInput, orderId?: string }
 * return: { orderId }
 */
exports.createCashOrder = onCall({ region: 'us-central1' }, async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para pedir.');
  }

  const { orderInput, orderId: clientOrderId } = request.data || {};
  if (!orderInput || !orderInput.restaurantId) {
    throw new HttpsError('invalid-argument', 'Faltan datos del pedido.');
  }
  if (orderInput.paymentMethod !== 'cash') {
    throw new HttpsError('invalid-argument', 'Método de pago no soportado.');
  }
  if (!orderInput.deliveryAddress) {
    throw new HttpsError('invalid-argument', 'Falta la dirección de entrega.');
  }

  // Id estable (lo genera el cliente por checkout) para ser idempotente entre
  // reintentos: si el pedido ya existe, se devuelve sin duplicar.
  const orderRef = clientOrderId
    ? db.collection('orders').doc(String(clientOrderId))
    : db.collection('orders').doc();
  const orderId = orderRef.id;

  const existing = await orderRef.get();
  if (existing.exists) {
    if (existing.get('customerId') !== uid) {
      throw new HttpsError('invalid-argument', 'Identificador de pedido inválido.');
    }
    return { orderId };
  }

  // Montos recalculados en el servidor (fuente de verdad): valida items, toma el
  // deliveryFee real del restaurante y revalida el cupón contra Firestore.
  const totals = await computeOrderTotals(orderInput);
  if (totals.total < 0) {
    throw new HttpsError('failed-precondition', 'El total del pedido es inválido.');
  }

  // Propina (solo efectivo): número >= 0; cualquier otra cosa se ignora.
  const tipNum = Number(orderInput.tip);
  const tip = Number.isFinite(tipNum) && tipNum > 0 ? round2(tipNum) : 0;

  const orderDoc = {
    customerId: uid, // desde auth, nunca del cliente
    restaurantId: orderInput.restaurantId,
    items: orderInput.items,
    subtotal: totals.subtotal,
    deliveryFee: totals.deliveryFee,
    discount: totals.discount,
    total: totals.total,
    deliveryAddress: orderInput.deliveryAddress,
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    couponCode: totals.couponCode,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    ...(tip > 0 ? { tip } : {}),
    ...(orderInput.customerName ? { customerName: orderInput.customerName } : {}),
    ...(orderInput.customerPhone ? { customerPhone: orderInput.customerPhone } : {}),
    ...(orderInput.specialInstructions
      ? { specialInstructions: orderInput.specialInstructions }
      : {}),
  };

  // Crear el pedido + consumir el cupón en un batch atómico (server-side).
  const batch = db.batch();
  batch.set(orderRef, orderDoc);
  if (totals.couponCode) {
    batch.update(db.collection('coupons').doc(totals.couponCode), {
      usedCount: FieldValue.increment(1),
    });
  }
  await batch.commit();

  return { orderId };
});

/**
 * saveCard — guarda una tarjeta (desde un token de Openpay.js) en el cliente
 * Openpay del usuario, sin cobrar. Devuelve marca + últimos 4 para mostrar.
 * data: { tokenId, deviceSessionId } -> { cardId, brand, last4 }
 */
exports.saveCard = onCall(
  { region: 'us-central1', secrets: [OPENPAY_PRIVATE_KEY] },
  async (request) => {
    const uid = request.auth && request.auth.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Inicia sesión.');
    const { tokenId, deviceSessionId } = request.data || {};
    if (!tokenId || !deviceSessionId) {
      throw new HttpsError('invalid-argument', 'Faltan datos de la tarjeta.');
    }

    const customerId = await getOrCreateOpenpayCustomer(
      uid,
      request.auth.token.name,
      request.auth.token.email
    );

    let card;
    try {
      card = await openpay.createCustomerCard(openpayCfg(), customerId, {
        tokenId,
        deviceSessionId,
      });
    } catch (e) {
      console.error('Guardar tarjeta falló', e.openpay || e.message);
      throw openpayError(e);
    }

    await writeSavedCard(uid, card);
    const num = card.card_number || '';
    return {
      cardId: card.id,
      brand: card.brand || null,
      last4: num ? num.slice(-4) : null,
    };
  }
);

/**
 * deleteCard — elimina una tarjeta guardada (Openpay + Firestore).
 * data: { cardId } -> { ok: true }
 */
exports.deleteCard = onCall(
  { region: 'us-central1', secrets: [OPENPAY_PRIVATE_KEY] },
  async (request) => {
    const uid = request.auth && request.auth.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Inicia sesión.');
    const { cardId } = request.data || {};
    if (!cardId) throw new HttpsError('invalid-argument', 'Falta la tarjeta.');

    const cardRef = db
      .collection('users')
      .doc(uid)
      .collection('cards')
      .doc(cardId);
    const cardSnap = await cardRef.get();
    if (!cardSnap.exists) {
      throw new HttpsError('not-found', 'Tarjeta no encontrada.');
    }

    const customerId = await getOpenpayCustomerId(uid);
    if (customerId) {
      try {
        await openpay.deleteCustomerCard(openpayCfg(), customerId, cardId);
      } catch (e) {
        // Si ya no existe en Openpay, seguimos borrando el registro local.
        console.warn('Delete card Openpay', e.openpay || e.message);
      }
    }

    const wasDefault = cardSnap.get('isDefault');
    await cardRef.delete();

    // Si era la predeterminada, marca otra como predeterminada.
    if (wasDefault) {
      const rest = await db
        .collection('users')
        .doc(uid)
        .collection('cards')
        .limit(1)
        .get();
      if (!rest.empty) {
        await rest.docs[0].ref.set({ isDefault: true }, { merge: true });
      }
    }

    return { ok: true };
  }
);

/**
 * openpayWebhook — recibe eventos de Openpay (charge.succeeded / .failed /
 * .refunded, y la verificación inicial) y reconcilia paymentStatus del pedido
 * de forma idempotente. Se autentica con Basic auth (usuario/clave del webhook
 * configurados en el panel de Openpay).
 */
exports.openpayWebhook = onRequest(
  {
    region: 'us-central1',
    secrets: [OPENPAY_WEBHOOK_USER, OPENPAY_WEBHOOK_PASS],
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Basic auth del webhook.
    const header = req.headers.authorization || '';
    const expected =
      'Basic ' +
      Buffer.from(
        `${OPENPAY_WEBHOOK_USER.value()}:${OPENPAY_WEBHOOK_PASS.value()}`
      ).toString('base64');
    if (header !== expected) {
      res.status(401).send('Unauthorized');
      return;
    }

    const body = req.body || {};

    // Openpay envía un evento 'verification' al registrar el webhook.
    if (body.type === 'verification') {
      console.log('Openpay webhook verification', body.verification_code);
      res.status(200).json({ verification_code: body.verification_code });
      return;
    }

    const tx = body.transaction || {};
    const chargeId = tx.id;
    const orderId = tx.order_id;
    if (!chargeId && !orderId) {
      res.status(200).send('ignored');
      return;
    }

    // Mapea el tipo de evento (nombres oficiales de Openpay) a paymentStatus.
    const statusByType = {
      'charge.succeeded': 'paid',
      'charge.failed': 'failed',
      'charge.cancelled': 'failed',
      'charge.refunded': 'refunded',
      'chargeback.accepted': 'refunded',
    };
    const newStatus = statusByType[body.type];
    if (!newStatus) {
      res.status(200).send('ignored');
      return;
    }

    // Localiza el pedido: por order_id (nuestro id) o por openpayChargeId.
    let ref = null;
    if (orderId) {
      const snap = await db.collection('orders').doc(orderId).get();
      if (snap.exists) ref = snap.ref;
    }
    if (!ref && chargeId) {
      const q = await db
        .collection('orders')
        .where('openpayChargeId', '==', chargeId)
        .limit(1)
        .get();
      if (!q.empty) ref = q.docs[0].ref;
    }

    if (!ref) {
      console.warn('Webhook Openpay sin pedido asociado', { chargeId, orderId, type: body.type });
      res.status(200).send('no-order');
      return;
    }

    // Idempotente: solo escribe si cambia el estado.
    const cur = (await ref.get()).get('paymentStatus');
    if (cur !== newStatus) {
      await ref.set(
        {
          paymentStatus: newStatus,
          ...(chargeId ? { openpayChargeId: chargeId } : {}),
          ...(newStatus === 'refunded' ? { refundedAt: FieldValue.serverTimestamp() } : {}),
        },
        { merge: true }
      );
    }

    res.status(200).send('ok');
  }
);

/**
 * refundOnCancel — cuando un pedido pagado con tarjeta (Openpay) pasa a
 * 'rejected' (lo rechaza el restaurante) o 'cancelled' (lo cancela el cliente),
 * reembolsa el cargo automáticamente y marca el pedido como 'refunded'. Así el
 * cliente nunca se queda cobrado por un pedido que no se va a preparar.
 */
exports.refundOnCancel = onDocumentUpdated(
  { document: 'orders/{orderId}', secrets: [OPENPAY_PRIVATE_KEY] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Solo al MOMENTO de pasar a rechazado/cancelado (evita re-disparos).
    const nowVoided = after.status === 'rejected' || after.status === 'cancelled';
    const statusChanged = before.status !== after.status;
    if (!nowVoided || !statusChanged) return;

    // Solo pagos con tarjeta Openpay ya cobrados y no reembolsados.
    if (after.paymentProvider !== 'openpay') return;
    if (after.paymentStatus !== 'paid') return;
    if (!after.openpayChargeId) return;

    try {
      await openpay.refundCharge(
        openpayCfg(),
        after.openpayChargeId,
        `Pedido ${after.status} — reembolso automático`
      );
    } catch (e) {
      // Si el reembolso falla, NO marcamos refunded: queda para reintento/revisión
      // manual (el pedido sigue 'paid' y saldrá en logs).
      console.error(
        'Reembolso Openpay falló',
        after.openpayChargeId,
        e.openpay || e.message
      );
      return;
    }

    await event.data.after.ref.set(
      { paymentStatus: 'refunded', refundedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    // Avisa al cliente que se le reembolsó el pago (notificación en tiempo real).
    if (after.customerId) {
      await db
        .collection('users')
        .doc(after.customerId)
        .collection('notifications')
        .add({
          type: 'order_update',
          title: 'Pago reembolsado',
          body: `Se reembolsó tu pago de $${Number(after.total || 0).toFixed(2)}. Puede tardar unos días en reflejarse en tu tarjeta.`,
          orderId: event.params.orderId,
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
        });
    }

    console.log('Pedido reembolsado', event.params.orderId, after.openpayChargeId);
  }
);

// ---------------------------------------------------------------------------
// share — Página web para compartir restaurante/platillo con vista previa rica
// (Open Graph). Al compartir el enlace https en WhatsApp/redes, se muestra la
// tarjeta con imagen + título + descripción; al abrirlo, botón para entrar a la
// app (deep link quickbite://). Se sirve vía rewrite de Hosting:
//   /r/{restaurantId}          -> restaurante
//   /p/{restaurantId}/{prodId} -> platillo
// ---------------------------------------------------------------------------
const SHARE_BASE = 'https://quickbite-6dee7.web.app';

function esc(s) {
  return String(s == null ? '' : s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function sharePage({ title, description, image, url, deepLink }) {
  const t = esc(title);
  const d = esc(description);
  const img = esc(image);
  const u = esc(url);
  const dl = esc(deepLink);
  const imgTags = img
    ? `<meta property="og:image" content="${img}"><meta name="twitter:image" content="${img}">`
    : '';
  return `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t} · QuickBite</title>
<meta property="og:type" content="website"><meta property="og:site_name" content="QuickBite">
<meta property="og:title" content="${t}"><meta property="og:description" content="${d}">
<meta property="og:url" content="${u}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}"><meta name="twitter:description" content="${d}">
${imgTags}
<style>
:root{--g:#086931;--g2:#2caf4b}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f1f5f4;color:#0f172a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#fff;border-radius:24px;overflow:hidden;max-width:420px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.12)}
.cover{width:100%;aspect-ratio:16/10;object-fit:cover;background:#e2e8f0;display:block}
.body{padding:22px}
.brand{display:flex;align-items:center;gap:8px;color:var(--g);font-weight:800;font-size:14px;margin-bottom:10px}
.brand .dot{width:22px;height:22px;border-radius:7px;background:var(--g);display:inline-block}
h1{font-size:22px;line-height:1.25;margin-bottom:6px}
p.desc{color:#475569;font-size:15px;margin-bottom:18px}
a.btn{display:block;text-align:center;background:var(--g);color:#fff;text-decoration:none;font-weight:700;padding:15px;border-radius:999px;font-size:16px}
.hint{color:#94a3b8;font-size:12px;text-align:center;margin-top:12px}
</style></head><body>
<div class="card">
${img ? `<img class="cover" src="${img}" alt="${t}">` : ''}
<div class="body">
<div class="brand"><span class="dot"></span> QuickBite</div>
<h1>${t}</h1>
<p class="desc">${d}</p>
<a class="btn" href="${dl}">Abrir en QuickBite</a>
<p class="hint">Abre este enlace desde tu teléfono con la app QuickBite instalada.</p>
</div></div></body></html>`;
}

exports.share = onRequest({ region: 'us-central1' }, async (req, res) => {
  const parts = (req.path || '').split('/').filter(Boolean);
  try {
    // /r/{restaurantId}
    if (parts[0] === 'r' && parts[1]) {
      const snap = await db.collection('restaurants').doc(parts[1]).get();
      if (!snap.exists) return res.status(404).send('No encontrado');
      const r = snap.data();
      const html = sharePage({
        title: r.name || 'Restaurante',
        description:
          (Array.isArray(r.cuisineTypes) && r.cuisineTypes.join(' · ')) ||
          r.description ||
          'Pide en QuickBite',
        image: r.coverImage || r.logoImage || '',
        url: `${SHARE_BASE}/r/${parts[1]}`,
        deepLink: `quickbite://restaurant/${parts[1]}`,
      });
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
      return res.status(200).send(html);
    }
    // /p/{restaurantId}/{productId}
    if (parts[0] === 'p' && parts[1] && parts[2]) {
      const snap = await db
        .collection('restaurants')
        .doc(parts[1])
        .collection('products')
        .doc(parts[2])
        .get();
      if (!snap.exists) return res.status(404).send('No encontrado');
      const p = snap.data();
      const html = sharePage({
        title: p.name || 'Platillo',
        description: p.description || `$${Number(p.price || 0).toFixed(2)} · QuickBite`,
        image: p.imageURL || '',
        url: `${SHARE_BASE}/p/${parts[1]}/${parts[2]}`,
        deepLink: `quickbite://product/${parts[2]}?restaurantId=${parts[1]}`,
      });
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
      return res.status(200).send(html);
    }
    return res.status(404).send('No encontrado');
  } catch (e) {
    console.error('share error', e);
    return res.status(500).send('Error');
  }
});