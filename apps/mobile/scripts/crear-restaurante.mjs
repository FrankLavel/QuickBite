// crear-restaurante.mjs
// Da de alta un usuario de RESTAURANTE (portal/dashboard) de una sola vez:
// crea el usuario en Firebase Auth + los documentos users/{uid} (role:restaurant)
// y restaurants/{uid} en Firestore. Usa el Admin SDK, así que SALTA las reglas
// de seguridad (no hay que tocar firestore.rules).
//
// Requisitos (una sola vez):
//   1. npm i -D firebase-admin        (en la carpeta quickbite-mobile)
//   2. Firebase Console → ⚙ Configuración del proyecto → Cuentas de servicio →
//      "Generar nueva clave privada" → guarda el archivo como:
//      scripts/serviceAccount.json   (ya está en .gitignore, NO lo commitees)
//
// Uso:
//   node scripts/crear-restaurante.mjs <correo> <contraseña> "<Nombre del Restaurante>"
// Ejemplo:
//   node scripts/crear-restaurante.mjs dueno@ruta77.com Secreta123 "Ruta 77"

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, 'serviceAccount.json');

if (!existsSync(keyPath)) {
  console.error(
    '\n❌ Falta scripts/serviceAccount.json.\n' +
      '   Descárgalo en Firebase Console → Configuración del proyecto →\n' +
      '   Cuentas de servicio → "Generar nueva clave privada", y guárdalo ahí.\n'
  );
  process.exit(1);
}

const [email, password, ...nameParts] = process.argv.slice(2);
const restaurantName = nameParts.join(' ').trim();

if (!email || !password || !restaurantName) {
  console.error(
    '\nUso: node scripts/crear-restaurante.mjs <correo> <contraseña> "<Nombre del Restaurante>"\n'
  );
  process.exit(1);
}
if (password.length < 6) {
  console.error('\n❌ La contraseña debe tener al menos 6 caracteres.\n');
  process.exit(1);
}

initializeApp({
  credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))),
});
const auth = getAuth();
const db = getFirestore();

async function main() {
  // 1) Usuario de Auth (si el correo ya existe, se reutiliza).
  let user;
  try {
    user = await auth.createUser({ email, password, displayName: restaurantName });
    console.log('✔ Usuario de Auth creado:', user.uid);
  } catch (e) {
    if (e.code === 'auth/email-already-exists') {
      user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, { password });
      console.log('✔ El correo ya existía; se reutiliza y se actualiza la contraseña:', user.uid);
    } else {
      throw e;
    }
  }
  const uid = user.uid;

  // 2) Perfil users/{uid} con rol restaurante.
  await db.collection('users').doc(uid).set(
    {
      uid,
      name: restaurantName,
      email: email.toLowerCase(),
      phone: '',
      photoURL: '',
      role: 'restaurant',
      restaurantId: uid,
      darkMode: false,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log('✔ users/' + uid + ' (role: restaurant)');

  // 3) Documento restaurants/{uid} con valores por defecto.
  await db.collection('restaurants').doc(uid).set(
    {
      id: uid,
      name: restaurantName,
      description: '',
      cuisineTypes: [],
      coverImage: '',
      logoImage: '',
      rating: 0,
      reviewCount: 0,
      deliveryTime: '25-35 min',
      deliveryFee: 0,
      minOrder: 0,
      address: '',
      deliveryZone: 5,
      isOpen: true,
      schedule: {},
    },
    { merge: true }
  );
  console.log('✔ restaurants/' + uid);

  console.log(
    `\n✅ Restaurante "${restaurantName}" listo.\n` +
      `   Entra al portal con: ${email}\n` +
      `   El resto (dirección, ubicación, horarios, portada) se completa desde Configuración.\n`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Error:', err?.code || '', err?.message || err);
    process.exit(1);
  });
