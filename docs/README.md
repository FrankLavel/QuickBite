# Documentación técnica — QuickBite Dashboard

Documentación **modular y orientada a desarrolladores** del Portal del Restaurante
(dashboard web/escritorio de QuickBite). Cada archivo cubre un tema y se puede leer
por separado.

> **Relación con `DOCUMENTACION.md`**
> En la raíz del repo, [`DOCUMENTACION.md`](../DOCUMENTACION.md) es el **entregable
> académico exhaustivo** (un solo documento, también exportado a `.docx`). Esta
> carpeta `docs/` es la versión **de desarrollo**: más concisa, por temas y pensada
> para trabajar en el código. Cuando aquí falte detalle, ese documento lo amplía.

## Índice

| Documento | Contenido |
|---|---|
| [architecture.md](architecture.md) | Arquitectura **actual (v1.0)** y **objetivo (v2.0)**, capas, actores y roles (incluye el futuro repartidor). |
| [database.md](database.md) | Modelo de datos de Firestore: colecciones, diccionario y diagrama entidad-relación. |
| [authentication.md](authentication.md) | Autenticación, roles, sesión, aprovisionamiento de cuentas de restaurante. |
| [api.md](api.md) | Superficie de "API": Cloud Functions (callable/HTTP/trigger) y la capa de servicios del dashboard. |
| [deployment.md](deployment.md) | Despliegue (Firebase Hosting), reglas/funciones, variables de entorno e integración continua (CI). |
| [decisions.md](decisions.md) | Registro de decisiones técnicas (ADR): qué se eligió y **por qué**. |

## Ecosistema

QuickBite son **tres piezas** sobre un mismo proyecto Firebase (`quickbite-6dee7`):

- **App móvil cliente** (`quickbite-mobile`) — el cliente explora, arma el carrito, paga y sigue su pedido.
- **Dashboard del restaurante** (este repo) — el restaurante gestiona menú, pedidos en tiempo real, promociones, analíticas, clientes y liquidaciones.
- **Cloud Functions** (`quickbite-mobile/functions`) — lógica de servidor de confianza: cobros/reembolsos con Openpay, notificaciones push y agregados.

La evolución **v2.0** añade una cuarta pieza: la **app de repartidor** (`QuickBite Driver`).
Ver [architecture.md](architecture.md#4-arquitectura-objetivo-v20).

## Estado

Sistema **funcional en entorno de pruebas (sandbox)**; sin despliegue a producción.
Versión base etiquetada como `v1.0.0`.
