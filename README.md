<div align="center">

# 🛵 QuickBite · Driver

**App del repartidor de QuickBite.**

Reclama pedidos listos, recógelos y márcalos como entregados — en tiempo real.

</div>

---

## ¿Qué es esto?

Tercera app del ecosistema QuickBite (junto al [dashboard del restaurante](../quickbite-dashboard) y la [app cliente](../quickbite-mobile)), sobre el mismo backend Firebase (`quickbite-6dee7`).

Modelo **auto-servicio**: el repartidor ve los pedidos que un restaurante marcó como **listos para recoger** y **sin repartidor**, reclama uno, lo recoge y lo entrega.

> Proyecto escolar en **modo de pruebas (sandbox)**. Primera iteración: **sin GPS** (llega después).

## Flujo del pedido (lado repartidor)

```
[Disponibles]  status = ready, sin driver
      │  reclamar (transacción: evita doble asignación)
      ▼
[Mis entregas] driverId = yo, status = ready
      │  "Recogí el pedido"
      ▼
   status = on_the_way
      │  "Marcar como entregado"
      ▼
   status = delivered  →  [Historial]
```

## Pantallas

- **Disponibles** — pedidos `ready` sin repartidor, en tiempo real.
- **Mis entregas** — pedidos activos que reclamé.
- **Historial** — entregas completadas.
- **Perfil** — datos, interruptor de disponibilidad, cerrar sesión.
- **Detalle** — recogida, dirección, contacto del cliente (llamar), artículos y la acción del momento.

## Tecnologías

| | |
|---|---|
| **Framework** | Expo `~54` · React Native `0.81` · TypeScript |
| **Navegación** | React Navigation 7 (stack + tabs) |
| **Estado** | React Context (`AuthContext`) |
| **Backend** | Firebase (Auth, Firestore) — proyecto `quickbite-6dee7` |

## Requisitos

- Node.js 20+, Expo CLI.
- La cuenta de repartidor debe estar **provisionada por el administrador**: un doc `users/{uid}` con `role: "driver"` (no hay autorregistro, por seguridad).

## Instalación

```bash
npm install
cp firebase.config.example.ts firebase.config.ts   # las keys web de Firebase son públicas
```

## Ejecución

```bash
npm start          # Expo (elige plataforma)
npm run android
npm run typecheck  # tsc --noEmit
```

## Reglas de seguridad (importante)

El rol `driver` y los permisos para reclamar/avanzar pedidos viven en
**`quickbite-mobile/firestore.rules`** (fuente de verdad compartida). Tras cambiarlas,
despliega desde ese repo:

```bash
# desde ../quickbite-mobile
firebase deploy --only firestore:rules
```

Sin ese deploy, la app no podrá leer ni reclamar pedidos.

## Limitaciones conocidas

- **Sesión en memoria**: firebase JS SDK v12 no expone persistencia para React Native,
  así que la sesión no sobrevive a cerrar la app por completo (se pide login al reabrir en frío).
- **Sin GPS** en esta iteración (planeado para la siguiente).
- El repartidor ve la información de entrega de **todos** los pedidos `ready` (modelo
  marketplace); endurecer esto es una mejora futura.
