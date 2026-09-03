# Guía de despliegue — QuickBite

Runbook para desplegar los cambios de la auditoría (reglas, Cloud Functions y
hosting). **Regla de oro: las Cloud Functions se despliegan ANTES que las reglas**
— las reglas nuevas dependen de funciones que deben existir primero (p. ej.
`orders.create: if false` requiere `createCashOrder`, y las reseñas requieren
`submitReview`). Desplegar las reglas primero rompería el checkout en efectivo y
el envío de reseñas.

Todo se despliega desde la carpeta de cada app (Firebase usa rutas relativas).

---

## 0. Prerrequisitos (una sola vez)

```bash
# Node 20+ y Firebase CLI
npm i -g firebase-tools
firebase login

# Java 21+ (solo si vas a correr el emulador/tests de reglas en local)
java -version   # debe ser >= 21

# Proyecto activo correcto
firebase use quickbite-6dee7
```

Instala las dependencias del monorepo y de las Functions (las Functions tienen su
propio `package.json`, no son un workspace):

```bash
# En la raíz del monorepo
npm ci

# Dependencias de las Cloud Functions
cd apps/mobile/functions && npm install && cd ../../..
```

---

## 1. Secretos (Secret Manager) — imprescindible antes del deploy

Las claves sensibles NO viven en el código. Verifica/define estos secretos:

```bash
cd apps/mobile

# Openpay (si no estaban ya definidos)
firebase functions:secrets:set OPENPAY_PRIVATE_KEY
firebase functions:secrets:set OPENPAY_WEBHOOK_USER
firebase functions:secrets:set OPENPAY_WEBHOOK_PASS

# NUEVO (F14): la private key de Web Push pasó a Secret Manager.
# Sin esto, notifyRestaurantOnNewOrder fallará al arrancar.
firebase functions:secrets:set VAPID_PRIVATE_KEY

# Ver qué secretos existen
firebase functions:secrets:access VAPID_PRIVATE_KEY   # (comprobación opcional)
```

Los parámetros NO sensibles (`OPENPAY_MERCHANT_ID`, `OPENPAY_SANDBOX`,
`VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`) se leen de `apps/mobile/functions/.env`.
Confírmalos antes de desplegar.

---

## 2. (Recomendado) Validar reglas en local antes de tocar producción

```bash
# En la raíz del monorepo — necesita Java 21 en el PATH
npm run test:rules -w apps/mobile      # 28 tests de Security Rules
npm run typecheck                      # los 4 workspaces
npm test                               # 92 tests
```

---

## 3. Desplegar las Cloud Functions (PRIMERO)

```bash
cd apps/mobile
firebase deploy --only functions
```

Incluye: `createCardCharge`, `createCashOrder`, `submitReview`, disparadores de
notificaciones (`onOrderStatusChange`, `notifyDriversOnReady`,
`notifyRestaurantOnNewOrder`, `onOfferCreated`, `onUserCreated`),
`onReviewWritten`, `refundOnCancel`, `openpayWebhook`, `syncAvailableOrders`,
`denormalizeDriverOnClaim` y `share`.

> Si el deploy pide confirmar el uso del secreto `VAPID_PRIVATE_KEY` en
> `notifyRestaurantOnNewOrder`, acepta. Si falla por secreto ausente, vuelve al
> paso 1.

## 4. Desplegar las Security Rules (DESPUÉS de las funciones)

```bash
# Sigues en apps/mobile
firebase deploy --only firestore:rules
firebase deploy --only storage        # solo si cambiaron las reglas de Storage
```

## 5. Desplegar el Hosting del dashboard

```bash
cd ../dashboard
npm run deploy        # expo export --platform web && firebase deploy --only hosting
```

---

## 6. Verificación post-deploy (smoke test)

Prueba en la app y el dashboard, en este orden:

1. **Pedido en efectivo** → se crea con `paymentStatus: pending` y el total
   correcto (lo recalcula `createCashOrder`, ya no el cliente).
2. **Pedido con tarjeta** (sandbox) → cobra y crea el pedido `paid`.
3. **Cupón** → aplica el descuento y `usedCount` sube en el servidor.
4. **Estados desde el dashboard** → `pending → accepted → preparing → ready`
   avanza; un salto (p. ej. marcar `delivered` de golpe) se **rechaza** (F4).
5. **Reseña** → solo se guarda si tienes un pedido entregado con ese producto (F7).
6. **Repartidor** → puede cambiar disponibilidad/vehículo (F1) y reclamar un
   pedido `ready`.
7. **Notificación al restaurante** (Web Push) al crear un pedido → confirma que el
   secreto VAPID quedó bien.

Revisa logs si algo falla:

```bash
cd apps/mobile
firebase functions:log --only createCashOrder,submitReview,notifyRestaurantOnNewOrder
```

---

## 7. Rollback

- **Reglas:** en Firebase Console → Firestore → Rules → historial → *Rollback* a
  la versión anterior. (O `git checkout <commit-previo> -- apps/mobile/firestore.rules`
  y redeploy.)
- **Functions:** `firebase deploy --only functions` desde el commit anterior. Si
  solo una función falla, redeploya esa: `firebase deploy --only functions:<nombre>`.
- **Hosting:** Console → Hosting → historial de versiones → *Rollback*.

> Nota: si haces rollback de las reglas a una versión que permitía crear pedidos
> desde el cliente, hazlo también de las funciones/app para no dejar el sistema
> inconsistente.

---

## Checklist rápido

```
[ ] npm ci  +  functions npm install
[ ] Secretos definidos (Openpay + VAPID_PRIVATE_KEY)
[ ] npm run test:rules  (28 verdes)
[ ] firebase deploy --only functions        (apps/mobile)   ← PRIMERO
[ ] firebase deploy --only firestore:rules  (apps/mobile)   ← DESPUÉS
[ ] npm run deploy                          (apps/dashboard)
[ ] Smoke test (efectivo, tarjeta, cupón, estados, reseña, push)
```
