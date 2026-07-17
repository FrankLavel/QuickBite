const {
  onDocumentUpdated,
  onDocumentCreated,
  onDocumentWritten,
} = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

// Mensaje al cliente por cada estado (debe coincidir con lib/orderStatus.ts).
const STATUS_MESSAGE = {
  accepted: 'Pedido confirmado, en preparación',
  preparing: 'Tu pedido está en cocina',
  ready: 'Tu pedido está listo para envío',
  on_the_way: 'Tu pedido está en camino',
  delivered: 'Pedido entregado — califica tu pedido',
  rejected: 'Tu pedido fue rechazado',
};

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

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: pushToken,
      sound: 'default',
      title: 'QuickBite',
      body: message,
      data: { orderId },
      channelId: 'default',
    }),
  });

  if (!res.ok) {
    console.error('Expo push falló', res.status, await res.text());
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

  await Promise.all(
    targets.map(async (uid) => {
      // Notificación en Firestore (pantalla en tiempo real).
      await db
        .collection('users')
        .doc(uid)
        .collection('notifications')
        .add({
          type: 'promo',
          title,
          body,
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
        });

      // Push al token Expo del cliente (si lo tiene registrado).
      const uSnap = await db.collection('users').doc(uid).get();
      const pushToken = uSnap.get('pushToken');
      if (!pushToken) return;

      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: pushToken,
          sound: 'default',
          title: 'QuickBite',
          body: `${title} — ${body}`,
          channelId: 'default',
        }),
      });
      if (!res.ok) {
        console.error('Expo push (promo) falló', res.status, await res.text());
      }
    })
  );
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
