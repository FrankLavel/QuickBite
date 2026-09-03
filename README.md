# QuickBite (monorepo)

Monorepo de QuickBite con [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces).

```
quickbite/
├── apps/
│   ├── mobile/        App cliente (Expo / React Native) + Cloud Functions
│   ├── dashboard/     Portal del restaurante (Expo Web)   [migración pendiente]
│   └── driver/        App del repartidor (Expo)            [migración pendiente]
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
