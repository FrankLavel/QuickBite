# Despliegue, entorno y CI

## 1. Requisitos

- **Node.js 20+**, npm, Expo CLI.
- Proyecto Firebase `quickbite-6dee7` (plan **Blaze** para Cloud Functions).

## 2. Variables de entorno / configuración

| Archivo | Versionado | Contenido |
|---|---|---|
| `firebase.config.ts` | **No** (`.gitignore`) | Config web de Firebase + `googleWebClientId`. |
| `firebase.config.example.ts` | Sí | Plantilla con la config real del proyecto. |
| `.env` | **No** | Variables locales. |
| `.env.example` | Sí | Plantilla. |

Para configurar en local: copiar `firebase.config.example.ts` → `firebase.config.ts`.

> Las **API keys web** de Firebase son **públicas por diseño** (viajan en el cliente);
> no son secretos. La llave **privada** de Openpay y las credenciales del webhook
> residen **solo** en **Secret Manager** (Cloud Functions), nunca en el repo.

## 3. Desarrollo

```bash
npm install
npm run web      # Dashboard en el navegador
npm run start    # Expo dev server
```

## 4. Despliegue del dashboard (Firebase Hosting)

El dashboard se exporta como web estática y se publica en **Firebase Hosting**:

```bash
npm run deploy   # = expo export --platform web && firebase deploy --only hosting
```

[`firebase.json`](../firebase.json) está configurado **solo para hosting** (para no
tocar las reglas/funciones del móvil) y sirve `dist/` como SPA. Incluye **rewrites**
que envían `/r/**` y `/p/**` a la Cloud Function `share` (enlaces con vista previa
Open Graph):

```
/r/**, /p/**  →  function: share (us-central1)
**            →  /index.html   (SPA fallback)
```

## 5. Reglas y funciones

Las **Firestore Security Rules** y las **Cloud Functions** son transversales al
ecosistema y su **fuente de verdad es el repo `quickbite-mobile`**. Se despliegan desde ahí:

```bash
# desde quickbite-mobile
firebase deploy --only functions,firestore:rules
```

> El archivo [`firestore.rules`](../firestore.rules) de este repo es una **copia de
> referencia** para entender la autorización; el `firebase.json` de aquí **no** las
> despliega a propósito.

## 6. Integración continua (CI)

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) corre en cada **push a
`main`** y en cada **pull request** (Node 20):

```
npm ci
cp firebase.config.example.ts firebase.config.ts   # el .ts real está gitignored
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint (eslint 9 flat)
npm run test:ci        # jest --ci --coverage
```

Los tests cubren la **lógica de negocio pura** (formato, validaciones, estados,
reglas de cupón). Ver [`src/**/__tests__/`](../src).

## 7. Versionado

- La versión base presentada está etiquetada como **`v1.0.0`** (`git tag`).
- La evolución con reparto en tiempo real será **`v2.0.0`** (ver [architecture.md](architecture.md#4-arquitectura-objetivo-v20)).
