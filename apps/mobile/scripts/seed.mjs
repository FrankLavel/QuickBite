// Carga los datos semilla de scripts/seed-data.json en Firestore.
// Usa el SDK cliente (firebase) que ya está instalado, NO el Admin SDK.
//
// Requiere permiso de escritura en Firestore. Si tus reglas seguras están
// publicadas (restaurants/coupons -> write:false), pon temporalmente Firestore
// en "modo de prueba" (allow read, write: if true) mientras corres esto, y
// vuelve a publicar firestore.rules al terminar.
//
// Ejecutar:  node scripts/seed.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  GeoPoint,
  Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBilZAqSE2CGeAEMuabVtvK6YYRrsLD0n4',
  authDomain: 'quickbite-6dee7.firebaseapp.com',
  projectId: 'quickbite-6dee7',
  messagingSenderId: '373417616626',
  appId: '1:373417616626:web:92364e6b15af6133aa9c6b',
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, 'seed-data.json'), 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  // --- restaurants + subcolecciones ---
  for (const r of data.restaurants) {
    const { _id, categories = [], products = [], location, ...rest } = r;
    await setDoc(doc(db, 'restaurants', _id), {
      ...rest,
      location: new GeoPoint(location.latitude, location.longitude),
    });
    console.log(`restaurant: ${_id}`);

    for (const c of categories) {
      const { _id: catId, ...catData } = c;
      await setDoc(doc(db, 'restaurants', _id, 'categories', catId), catData);
    }
    console.log(`  categories: ${categories.length}`);

    for (const p of products) {
      const { _id: prodId, ...prodData } = p;
      await setDoc(doc(db, 'restaurants', _id, 'products', prodId), prodData);
    }
    console.log(`  products: ${products.length}`);
  }

  // --- coupons ---
  for (const cp of data.coupons) {
    const { _id, expiresAt, ...rest } = cp;
    await setDoc(doc(db, 'coupons', _id), {
      ...rest,
      expiresAt: Timestamp.fromDate(new Date(expiresAt)),
    });
    console.log(`coupon: ${_id}`);
  }

  // --- offers ---
  for (const of of data.offers ?? []) {
    const { _id, ...rest } = of;
    await setDoc(doc(db, 'offers', _id), rest);
    console.log(`offer: ${_id}`);
  }

  console.log('\n✅ Datos semilla cargados.');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Error al sembrar:', err?.code || '', err?.message || err);
    process.exit(1);
  });
