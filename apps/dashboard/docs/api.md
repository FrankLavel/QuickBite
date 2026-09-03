# API y capa de servicios

QuickBite no tiene una API REST propia: la "API" son (1) las **Cloud Functions** de
confianza y (2) el acceso directo a **Firestore/Storage** vía el SDK, encapsulado en
la **capa de servicios** del dashboard.

---

## 1. Cloud Functions

Definidas en el repo `quickbite-mobile/functions` (Node 22, Cloud Functions v2) y
**compartidas** por las tres apps. Se despliegan desde ese repo (ver [deployment.md](deployment.md)).

| Función | Tipo | Rol |
|---|---|---|
| `createCardCharge` | callable | Recalcula los montos en el servidor, cobra en Openpay (idempotente por `orderId`) y crea el pedido ya pagado. |
| `openpayWebhook` | HTTP | Reconcilia `paymentStatus` con eventos asíncronos de Openpay (reembolsos, contracargos). |
| `refundOnCancel` | trigger Firestore | Reembolsa automáticamente al pasar un pedido pagado a `rejected`/`cancelled`. |
| `share` | HTTP | Sirve una vista con metadatos Open Graph para compartir enlaces (`/r/**`, `/p/**`); ver rewrites en [deployment.md](deployment.md). |

> **Confianza cero en el cliente**: el importe a cobrar **siempre** se recalcula en
> `createCardCharge`; nunca se confía en el total enviado por la app.

### Planeadas (v2.0)
- **Asignación de repartidor** — asigna `driverId` a un pedido listo.
- **Envío de notificaciones (FCM)** — push por cada cambio del ciclo del pedido a cliente, restaurante y repartidor.

---

## 2. Capa de servicios (dashboard)

Cada servicio en [`src/services/`](../src/services/) aísla el acceso a datos. Las
pantallas **no** llaman a Firestore directamente.

| Servicio | Funciones principales |
|---|---|
| [`authService`](../src/services/authService.ts) | `loginRestaurant`, `registerRestaurant`, `loginWithGoogle`, `loginWithGoogleIdToken`, `loadSession`, `logoutRestaurant`, `sendRestaurantPasswordReset`, `updateUserProfile`, `updateRestaurantProfile` |
| [`orderService`](../src/services/orderService.ts) | `getRestaurantOrders`, `listenRestaurantOrders` (tiempo real), `updateOrderStatus`, `markOrdersSettled`, `unmarkOrdersSettled` |
| [`productService`](../src/services/productService.ts) | `getProducts`, `getProductById`, `createProduct`, `updateProduct`, `setProductAvailability`, `deleteProduct` |
| [`categoryService`](../src/services/categoryService.ts) | `getCategories`, `createCategory`, `updateCategory`, `deleteCategory` |
| [`couponService`](../src/services/couponService.ts) | `getCouponsByRestaurant`, `getCouponByCode`, `createCoupon`, `updateCoupon`, `deleteCoupon`, `setCouponActive` + reglas puras (`isCouponExpired`, `canRedeemCoupon`…) |
| [`offerService`](../src/services/offerService.ts) | `getOffersByRestaurant`, `createOffer`, `updateOffer`, `deleteOffer`, `setOfferActive`, `offerToFormData` |
| [`storageService`](../src/services/storageService.ts) | `uploadProductImage`, `uploadRestaurantLogo`, `uploadRestaurantCover`, `uploadOfferImage`, `deleteStoragePath` |
| [`geocode`](../src/services/geocode.ts) | `geocodeAddress` (Nominatim / OpenStreetMap) |
| [`firebase`](../src/services/firebase.ts) | Inicialización del SDK (`auth`, `db`, `storage`) + `isPlaceholderFirebaseConfig` |

### Tiempo real

`listenRestaurantOrders` usa `onSnapshot`; `OrderContext` la consume y detecta
pedidos nuevos para disparar toast + sonido. El resto de lecturas son puntuales
(`getDocs`).

### Convenciones

- **Funciones puras de negocio** (formato, validación, reglas de cupón) viven en
  `utils/` y en la parte pura de los servicios; están **cubiertas por tests**
  (ver [deployment.md](deployment.md#6-integración-continua-ci)).
- Formateo de moneda/números **siempre** vía [`utils/format.ts`](../src/utils/format.ts) (nada de `toFixed` suelto).
