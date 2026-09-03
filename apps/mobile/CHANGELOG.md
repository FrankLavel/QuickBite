# Changelog — QuickBite (App cliente)

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y
versionado semántico.

## [2.0.0] — 2026-08-26

Evolución v2.0 del ecosistema QuickBite: soporte de reparto en tiempo real y
notificaciones, más profesionalización (tests, CI, seguridad).

### Añadido
- **Rol repartidor** en las reglas de Firestore: reclamo y avance de pedidos y
  ubicación en vivo (`deliveryTracking/{orderId}`).
- **Seguimiento en el mapa**: la pantalla de seguimiento muestra al repartidor y
  el destino en un mapa nativo cuando el pedido va en camino.
- **Notificaciones**: push a repartidores disponibles al haber un pedido listo
  (`notifyDriversOnReady`), **Web Push** al restaurante en pedidos nuevos
  (`notifyRestaurantOnNewOrder`), y aviso al cliente cuando cancela su pedido.
- **Testing**: `jest-expo` + 21 tests (geo/cobertura de reparto, promos y 2x1,
  horario abierto/cerrado). **CI** con GitHub Actions.

### Seguridad
- **H1**: los repartidores ya no leen el pedido completo (PII) de todos los
  pedidos `ready`; ven una proyección redactada `availableOrders/{orderId}` y solo
  leen el pedido al reclamarlo.
- **H2**: el nombre/teléfono del repartidor se denormaliza desde su perfil real
  (Cloud Function), no lo escribe el propio repartidor.

## [1.0.0] — 2026

Versión base: app cliente (Android) con exploración de restaurantes, carrito,
checkout, pagos Openpay, seguimiento de pedidos y notificaciones.
