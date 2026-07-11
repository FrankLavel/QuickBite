const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
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
