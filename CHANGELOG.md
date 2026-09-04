# Changelog — QuickBite

Versiones notables del ecosistema QuickBite (monorepo).

## [2.0.0] — 2026-09-03

Primera versión del **ecosistema unificado en monorepo**, tras la auditoría de
seguridad y arquitectura. Consolida app cliente, dashboard y repartidor con un
contrato de dominio compartido, y endurece pagos, reglas y pedidos.

### Arquitectura
- Monorepo con npm workspaces (`apps/mobile`, `apps/dashboard`, `apps/driver`) +
  paquete de dominio compartido `@quickbite/shared` (F5).
- Historia de los tres repos preservada (`git subtree`). Todo en **Expo SDK 54**.

### Seguridad y correctitud
- Pedidos en efectivo creados server-side; el cliente ya no fija los montos (F2).
- Precios, toppings y promos recalculados desde la fuente autoritativa (F16).
- Consumo de cupón en transacción server-side; reglas cerradas al cliente (F3).
- Máquina de estados del pedido validada en las reglas (F4).
- Reseñas verificadas contra el producto vía Cloud Function `submitReview` (F7).
- Validación de esquema del catálogo (precio ≥ 0, nombre, deliveryFee) (F8).
- Permisos del repartidor `isAvailable`/`vehicle` (F1) y rating 1–5 del pedido (F6).
- `VAPID_PRIVATE_KEY` en Secret Manager (F14); batching de push en lotes de 100 (F12).
- Eliminado el `firestore.rules` muerto del dashboard (F10).

### Testing y CI/CD
- Suite de **28 tests de Security Rules** con el emulador + **92 tests** de las
  apps (F9), verdes en un runner real de GitHub Actions.
- Workflow de **deploy automático** `deploy.yml` (funciones → reglas → hosting) (F15).

### Despliegue
- Cloud Functions y Security Rules desplegadas a producción.
- Dashboard publicado en Firebase Hosting (`quickbite-6dee7.web.app`).
- APKs de preview (repartidor y app cliente) compilados en EAS.

### Decisiones documentadas (no bloquean)
- GPS en Firestore a ≤5 s durante entrega activa; Realtime DB queda como futuro (F11).
- Telemetría de errores del cliente: best-effort; SDK formal aparte (F13).

Detalles del despliegue en [`DEPLOY.md`](./DEPLOY.md) y de la auditoría en la
documentación del proyecto.
