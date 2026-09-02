/**
 * Tests de las Security Rules de Firestore contra el emulador.
 * Cubren lo endurecido en esta auditoría: disponibilidad/vehículo del repartidor
 * (F1), rating 1–5 del pedido (F6), cierre de creación de pedidos (F2) y de la
 * escritura de cupones por el cliente (F3), además del reclamo concurrente del
 * repartidor y controles base de lectura.
 *
 * Se ejecuta con:  npm run test:rules  (arranca el emulador de Firestore).
 */
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} = require('firebase/firestore');

let testEnv;

/** Firestore para un usuario autenticado (o anónimo si uid es null). */
function asUser(uid, token = {}) {
  return uid
    ? testEnv.authenticatedContext(uid, token).firestore()
    : testEnv.unauthenticatedContext().firestore();
}

/** Siembra datos saltándose las reglas (setup). */
function seed(fn) {
  return testEnv.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'quickbite-rules-test',
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '..', 'firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  // Perfiles base usados por varias pruebas.
  await seed(async (d) => {
    await setDoc(doc(d, 'users/cust1'), { role: 'customer', name: 'Cliente' });
    await setDoc(doc(d, 'users/driver1'), { role: 'driver', name: 'Repartidor', isAvailable: true });
    await setDoc(doc(d, 'users/driver2'), { role: 'driver', name: 'Repartidor 2', isAvailable: true });
    await setDoc(doc(d, 'users/restOwner'), { role: 'restaurant', restaurantId: 'r1', name: 'Dueño' });
  });
});

describe('F1 · perfil del repartidor', () => {
  test('puede activar/desactivar su disponibilidad (bool)', async () => {
    const d = asUser('driver1');
    await assertSucceeds(updateDoc(doc(d, 'users/driver1'), { isAvailable: false }));
  });

  test('puede editar su vehículo (string)', async () => {
    const d = asUser('driver1');
    await assertSucceeds(updateDoc(doc(d, 'users/driver1'), { vehicle: 'Moto' }));
  });

  test('rechaza isAvailable con tipo inválido', async () => {
    const d = asUser('driver1');
    await assertFails(updateDoc(doc(d, 'users/driver1'), { isAvailable: 'sí' }));
  });

  test('rechaza vehicle con tipo inválido', async () => {
    const d = asUser('driver1');
    await assertFails(updateDoc(doc(d, 'users/driver1'), { vehicle: 123 }));
  });

  test('nunca puede cambiar su rol', async () => {
    const d = asUser('driver1');
    await assertFails(updateDoc(doc(d, 'users/driver1'), { role: 'restaurant' }));
  });
});

describe('F6 · rating del pedido', () => {
  beforeEach(async () => {
    await seed((d) =>
      setDoc(doc(d, 'orders/o1'), {
        customerId: 'cust1',
        restaurantId: 'r1',
        status: 'delivered',
        paymentStatus: 'paid',
        total: 100,
      })
    );
  });

  test('acepta un entero 1–5', async () => {
    const c = asUser('cust1');
    await assertSucceeds(updateDoc(doc(c, 'orders/o1'), { rating: 5 }));
  });

  test('rechaza fuera de rango', async () => {
    const c = asUser('cust1');
    await assertFails(updateDoc(doc(c, 'orders/o1'), { rating: 7 }));
    await assertFails(updateDoc(doc(c, 'orders/o1'), { rating: 0 }));
  });

  test('rechaza no-entero', async () => {
    const c = asUser('cust1');
    await assertFails(updateDoc(doc(c, 'orders/o1'), { rating: 4.5 }));
  });
});

describe('F2 · creación de pedidos cerrada al cliente', () => {
  test('el cliente no puede crear un pedido (lo crea una Cloud Function)', async () => {
    const c = asUser('cust1');
    await assertFails(
      setDoc(doc(c, 'orders/new1'), {
        customerId: 'cust1',
        restaurantId: 'r1',
        status: 'pending',
        paymentStatus: 'pending',
        total: 50,
      })
    );
  });
});

describe('F3 · cupones', () => {
  beforeEach(async () => {
    await seed((d) =>
      setDoc(doc(d, 'coupons/SAVE10'), {
        restaurantId: 'r1',
        isActive: true,
        usedCount: 0,
        maxUses: 100,
        minOrder: 0,
        type: 'percent',
        value: 10,
      })
    );
  });

  test('el cliente NO puede incrementar usedCount', async () => {
    const c = asUser('cust1');
    await assertFails(updateDoc(doc(c, 'coupons/SAVE10'), { usedCount: 1 }));
  });

  test('el restaurante dueño sí puede editar su cupón', async () => {
    const ro = asUser('restOwner');
    await assertSucceeds(updateDoc(doc(ro, 'coupons/SAVE10'), { isActive: false }));
  });
});

describe('Reparto · reclamo concurrente', () => {
  test('un repartidor reclama un pedido listo y sin driver', async () => {
    await seed((d) =>
      setDoc(doc(d, 'orders/o2'), {
        customerId: 'cust1',
        restaurantId: 'r1',
        status: 'ready',
        paymentStatus: 'paid',
        total: 80,
      })
    );
    const d2 = asUser('driver2');
    await assertSucceeds(
      updateDoc(doc(d2, 'orders/o2'), {
        driverId: 'driver2',
        assignedAt: serverTimestamp(),
      })
    );
  });

  test('no puede reclamar un pedido que ya tiene repartidor', async () => {
    await seed((d) =>
      setDoc(doc(d, 'orders/o3'), {
        customerId: 'cust1',
        restaurantId: 'r1',
        status: 'ready',
        paymentStatus: 'paid',
        total: 80,
        driverId: 'otro',
      })
    );
    const d2 = asUser('driver2');
    await assertFails(
      updateDoc(doc(d2, 'orders/o3'), {
        driverId: 'driver2',
        assignedAt: serverTimestamp(),
      })
    );
  });
});

describe('F4 · máquina de estados del restaurante', () => {
  function seedOrder(id, status, extra = {}) {
    return seed((d) =>
      setDoc(doc(d, `orders/${id}`), {
        customerId: 'cust1',
        restaurantId: 'r1',
        status,
        paymentStatus: 'paid',
        total: 100,
        ...extra,
      })
    );
  }

  test('avanza un paso válido (pending → accepted)', async () => {
    await seedOrder('m1', 'pending');
    const ro = asUser('restOwner');
    await assertSucceeds(
      updateDoc(doc(ro, 'orders/m1'), { status: 'accepted', acceptedAt: serverTimestamp() })
    );
  });

  test('rechaza un salto de estado (pending → delivered)', async () => {
    await seedOrder('m2', 'pending');
    const ro = asUser('restOwner');
    await assertFails(
      updateDoc(doc(ro, 'orders/m2'), { status: 'delivered', deliveredAt: serverTimestamp() })
    );
  });

  test('permite rechazar un pedido pendiente', async () => {
    await seedOrder('m3', 'pending');
    const ro = asUser('restOwner');
    await assertSucceeds(
      updateDoc(doc(ro, 'orders/m3'), { status: 'rejected', rejectionReason: 'sin stock' })
    );
  });

  test('no permite retroceder (ready → pending)', async () => {
    await seedOrder('m4', 'ready');
    const ro = asUser('restOwner');
    await assertFails(updateDoc(doc(ro, 'orders/m4'), { status: 'pending' }));
  });

  test('permite liquidar (settledAt) sin cambiar el status', async () => {
    await seedOrder('m5', 'delivered');
    const ro = asUser('restOwner');
    await assertSucceeds(updateDoc(doc(ro, 'orders/m5'), { settledAt: serverTimestamp() }));
  });
});

describe('Lecturas base', () => {
  beforeEach(async () => {
    await seed(async (d) => {
      await setDoc(doc(d, 'restaurants/r1'), { name: 'Restaurante' });
      await setDoc(doc(d, 'users/otro'), { role: 'customer', name: 'Otro' });
    });
  });

  test('anónimo no puede leer el catálogo', async () => {
    const anon = asUser(null);
    await assertFails(getDoc(doc(anon, 'restaurants/r1')));
  });

  test('un usuario autenticado sí puede leer el catálogo', async () => {
    const c = asUser('cust1');
    await assertSucceeds(getDoc(doc(c, 'restaurants/r1')));
  });

  test('un usuario no puede leer el perfil de otro', async () => {
    const c = asUser('cust1');
    await assertFails(getDoc(doc(c, 'users/otro')));
  });
});
