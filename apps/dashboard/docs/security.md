# Seguridad

Auditoría del modelo de seguridad del ecosistema QuickBite (dashboard + app cliente
+ app Driver + Cloud Functions), con foco en la superficie nueva de la v2.0
(reparto, GPS, notificaciones). Fecha: 2026-08-26.

> **Resultado:** no se encontraron vulnerabilidades críticas ni de alto riesgo
> explotables. La autorización se aplica en el servidor (Firestore Security Rules
> + Cloud Functions con Admin SDK) y resiste manipulación desde el cliente. Los
> hallazgos **H1** (exposición de PII a repartidores) y **H2** (suplantación de
> datos del repartidor) fueron **corregidos** el 2026-08-26; queda **H3**, una nota
> de endurecimiento de baja prioridad.

---

## 1. Modelo de seguridad

- **Autenticación**: Firebase Authentication (correo/contraseña y Google).
- **Autorización**: **Firestore Security Rules** (fuente de verdad en
  [`quickbite-mobile/firestore.rules`](../../quickbite-mobile/firestore.rules)) +
  Cloud Functions con **Admin SDK** para operaciones de confianza (cobros,
  reembolsos, notificaciones).
- **Roles** (`users/{uid}.role`): `customer`, `restaurant`, `driver`.
- **Aprovisionamiento**: solo `customer` se **autorregistra**. `restaurant` y
  `driver` los crea el administrador por consola/Admin SDK — el cliente **no puede
  autoasignarse** esos roles (la regla de `create` de `users` exige `role=='customer'`).

## 2. Verificaciones (lo que quedó confirmado seguro)

| Área | Verificación |
|---|---|
| **Escalada de rol** | ✅ No es posible autoasignarse `restaurant`/`driver` (create solo permite `customer`). |
| **Cobro / montos** | ✅ El cliente no puede crear pedidos `paid`; los montos se recalculan en `createCardCharge` (servidor). Las reglas de `update` de `orders` restringen los campos por rol (nunca `items`, `total`, `customerId`). |
| **Reclamo de pedido (driver)** | ✅ Transacción + regla: solo un pedido `ready` sin repartidor puede reclamarse, y `driverId` se fija al propio uid. No hay doble asignación ni robo de pedido ajeno. |
| **Avance de estado (driver)** | ✅ Solo el repartidor asignado (`driverId==uid`) avanza `ready→on_the_way→delivered`, con allowlist de campos. |
| **Ubicación en vivo** | ✅ `deliveryTracking/{orderId}`: escribe solo el repartidor asignado (verificado contra el pedido); leen solo repartidor/cliente/restaurante de ese pedido; se borra al entregar. |
| **Web Push** | ✅ Llave VAPID **pública** en el cliente (segura por diseño); la **privada** solo en las Cloud Functions. La suscripción se guarda en el doc del propio usuario y el push llega solo a su suscripción. |
| **XSS (dashboard)** | ✅ React escapa el contenido; no hay `dangerouslySetInnerHTML`. El `iframe` del mapa apunta a openstreetmap.org con coordenadas numéricas. |
| **Secretos** | ✅ `firebase.config.ts` (keys web públicas), llaves privadas de Openpay en Secret Manager, VAPID privada en `functions/.env` (gitignored). |

## 3. Hallazgos

### H1 · Exposición de PII del cliente a repartidores — ✅ RESUELTO (2026-08-26)
**Era:** cualquier repartidor podía leer el pedido **completo** (nombre, teléfono,
dirección) de **todos** los pedidos `ready`, aunque no los reclamara.
**Arreglo:** el repartidor ya **no** puede leer pedidos `ready` que no le
pertenecen (la regla de lectura de `orders` para `driver` se limitó a
`driverId == uid`). En su lugar ve una **proyección redactada sin PII**,
`availableOrders/{orderId}` (restaurante, zona/ciudad, total, nº de artículos), que
mantiene la Cloud Function `syncAvailableOrders`. Solo al **reclamar** el pedido
(driverId = uid) puede leer los datos completos para la entrega. El cliente y el
restaurante siguen leyendo el pedido como antes (sin cambios).

### H2 · El repartidor controla `driverName`/`driverPhone` del pedido — ✅ RESUELTO (2026-08-26)
**Era:** al reclamar, el repartidor escribía su nombre/teléfono sin validación.
**Arreglo:** el reclamo solo puede escribir `driverId`+`assignedAt` (allowlist
reducido). El nombre y teléfono los denormaliza la Cloud Function
`denormalizeDriverOnClaim` desde el **perfil real** del repartidor (`users/{uid}`),
por lo que el cliente/restaurante ven datos verificados, no los que escriba el driver.

### H3 · VAPID privada en `.env` (Bajo · endurecimiento)
**Qué:** `VAPID_PRIVATE_KEY` vive en `functions/.env` (gitignored) en lugar de
Secret Manager. En sandbox es aceptable; en producción conviene moverla a
**Secret Manager** (`firebase functions:secrets:set`), como ya se hace con las
llaves de Openpay.

## 4. Cobertura del checklist (Semana 3 de la guía)

- [x] Revisar Firebase Security Rules / autorización del backend.
- [x] Verificar acceso por rol y propietario del recurso.
- [x] Proteger pantallas privadas (gating de sesión en el dashboard).
- [x] Revisar autenticación, recuperación de contraseña y sesión.
- [x] Secretos y configuraciones sensibles fuera del repositorio.
- [x] Validación de entradas (formato/validación centralizados; el servidor no
      confía en el cliente).
- [x] Revisar permisos, Storage y exposición accidental de información (ver H1).
