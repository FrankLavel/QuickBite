# Changelog — QuickBite Driver

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y
versionado semántico.

## [1.0.0] — 2026-08-26

Primera versión de **QuickBite Driver**, la app del repartidor. Se lanza como parte
del release **v2.0.0** del ecosistema QuickBite.

### Añadido
- App móvil del repartidor (Expo SDK 54, React Navigation) sobre el mismo Firebase.
- **Modelo auto-servicio**: el repartidor ve una lista **redactada** de pedidos
  disponibles (sin PII), reclama uno, lo recoge y lo entrega.
- **GPS en primer plano**: comparte su ubicación en `deliveryTracking/{orderId}`
  mientras va en camino.
- **Notificaciones push** de pedidos nuevos disponibles.
- **Navegación a Maps** ("Cómo llegar") y distancia de la entrega.
- Pantallas de **Inicio/Resumen**, **Ganancias/estadísticas** e historial, y
  **modo oscuro** (system/claro/oscuro).
- **Testing** (`jest-expo`, 12 tests: formato, geo, estadísticas) y **CI**
  (GitHub Actions: typecheck + tests).
