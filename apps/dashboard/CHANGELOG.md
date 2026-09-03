# Changelog — QuickBite Dashboard

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/) y
versionado semántico.

## [2.0.0] — 2026-08-26

Evolución v2.0 del ecosistema QuickBite: reparto en tiempo real, notificaciones y
profesionalización (docs, tests, CI, seguridad).

### Añadido
- **Reparto en Entregas**: la pantalla muestra el repartidor asignado (nombre,
  teléfono, estado) y un botón **"Seguir en vivo"** con la ubicación del
  repartidor en un mapa (OpenStreetMap embebido, sin API key).
- **Web Push al restaurante**: avisos de pedidos nuevos aunque el dashboard esté
  cerrado (service worker + VAPID + Cloud Function).
- **Documentación** modular en [`docs/`](docs/README.md): arquitectura (v1 y v2),
  modelo de datos, autenticación, API, despliegue, **seguridad** y decisiones (ADR).
- **Testing**: `jest-expo` + 49 tests de lógica de negocio (formato, validación,
  horario, reglas de cupón, ofertas).
- **CI**: GitHub Actions (typecheck, lint, tests) en cada push a `main` y PR.

### Seguridad
- Auditoría documentada en [`docs/security.md`](docs/security.md). Corregidos los
  hallazgos H1 (exposición de PII del cliente a repartidores) y H2 (suplantación
  de datos del repartidor).

### Corregido
- `getErrorMessage(undefined/null)` provocaba un crash (guard añadido, detectado
  por un test).

## [1.0.0] — 2026-08-24

Versión base presentada: dashboard administrativo + PWA sobre Firebase, con pagos
Openpay (sandbox), liquidaciones, ofertas, portal solo-login, verificación de
correo y cobertura de reparto.
