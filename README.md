# QuickBite (monorepo)

Monorepo de QuickBite con [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces).

```
quickbite/
├── apps/
│   ├── mobile/        App cliente (Expo / React Native) + Cloud Functions
│   ├── dashboard/     Portal del restaurante (Expo Web)
│   └── driver/        App del repartidor (Expo)
└── packages/
    └── shared/        Contrato de dominio compartido (@quickbite/shared)
```

## Por qué un monorepo

Antes, cada app definía por su cuenta los estados del pedido, las transiciones y
la forma del documento `Order`, con riesgo de divergencia silenciosa entre repos.
`@quickbite/shared` es ahora la **única fuente de verdad** del contrato de pedido,
alineada con las Security Rules que lo hacen cumplir en el servidor.

## Comandos

```bash
npm install            # instala todos los workspaces (hoisted)
npm run typecheck      # typecheck de cada workspace
npm test               # tests de cada workspace
```

La historia de cada app se preservó al integrarla (via `git subtree`).

## CI

`.github/workflows/ci.yml` corre en cada push a `main` y cada PR:
- **quality**: `npm ci` + `npm run typecheck` + `npm test` (los 4 workspaces).
- **rules**: Security Rules de Firestore contra el emulador
  (`npm run test:rules -w apps/mobile`, con Java 21 + firebase-tools).

## Despliegue

Cada app se despliega desde su carpeta (Firebase usa rutas relativas al app):

```bash
# Cloud Functions + Security Rules (desde la app cliente) — functions primero
cd apps/mobile && firebase deploy --only functions
cd apps/mobile && firebase deploy --only firestore:rules

# Hosting del dashboard
cd apps/dashboard && npm run deploy

# Builds nativos (EAS) de mobile / driver
cd apps/mobile && eas build --profile production
```

> EAS toma el lockfile de la raíz del monorepo al correr desde la carpeta del
> app; conviene verificar el primer build de EAS tras la migración.

