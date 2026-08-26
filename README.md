<div align="center">

# 🍔 QuickBite · Portal del Restaurante

**Panel de administración web para las fondas y restaurantes de QuickBite.**

Pedidos en tiempo real, menú, promociones, horarios, liquidaciones y analítica — todo desde un solo lugar.

[🌐 App en vivo](https://quickbite-6dee7.web.app) · Instalable como PWA en el escritorio

</div>

---

## ¿Qué es esto?

QuickBite es una plataforma de pedidos a domicilio pensada para apoyar a las fondas de Michoacán, con una **comisión del 7%** (frente al 15–30% de las plataformas grandes). El ecosistema tiene **dos aplicaciones** sobre un mismo backend en la nube:

- **Portal del Restaurante** (este repositorio) — panel web.
- **App móvil del cliente** (Android) — [repositorio aparte](https://github.com/FrankLavel/Quick_mobil).

> Proyecto escolar, funcional y desplegado en **modo de pruebas (sandbox)**.

## Funcionalidades

- 📥 **Pedidos en tiempo real** — entran solos al panel; aceptar o rechazar con motivo.
- 🍽️ **Menú** — categorías y platillos con imágenes (Firebase Storage).
- 🎟️ **Promociones** — banners, cupones y ofertas de platillo con vigencia.
- 🕒 **Horarios y estado** — abierto/cerrado automático por horario o manual.
- 💵 **Liquidaciones** — cálculo de la comisión del 7% por periodo.
- 📊 **Analítica** — mapa de calor de horas pico, KPIs de ventas y exportación a CSV.
- 🌙 **Modo oscuro**, avisos en tiempo real y preferencias del panel.
- 📲 **PWA** — instalable en el escritorio; verificada e indexada en Google Search Console.

## Tecnologías

| | |
|---|---|
| **Framework** | Expo `~53` · React Native Web · TypeScript |
| **Navegación** | React Navigation |
| **Estado** | React Context |
| **Backend** | Firebase (Auth, Firestore, Storage, Cloud Functions, Hosting) |
| **Despliegue** | Firebase Hosting |

## Requisitos

- Node.js 18+
- Un proyecto de **Firebase**
- Firebase CLI (`npm i -g firebase-tools`) para desplegar

## Instalación

```bash
git clone https://github.com/FrankLavel/Quick_web.git
cd Quick_web
npm install
```

### Configuración de Firebase

Copia la plantilla y pega tus credenciales (el archivo real está en `.gitignore`):

```bash
cp firebase.config.example.ts firebase.config.ts
# edita firebase.config.ts con tu apiKey, messagingSenderId y appId
```

## Scripts

```bash
npm start          # inicia Expo (elige web con la tecla w)
npm run web        # abre directamente en el navegador
npm run build:web  # exporta el sitio estático a dist/
npm run deploy     # exporta + despliega a Firebase Hosting
npm test           # ejecuta los tests (Jest)
npm run typecheck  # verifica tipos (tsc --noEmit)
npm run lint       # ESLint (expo lint)
```

## Despliegue

```bash
npm run deploy
```

Sube el panel a Firebase Hosting (**https://quickbite-6dee7.web.app**). El `firebase.json` está configurado solo para *hosting*, para no tocar las reglas de Firestore (que se administran desde el repo móvil).

## Documentación

- **[`docs/`](docs/README.md)** — documentación técnica modular: [arquitectura](docs/architecture.md) (actual y objetivo v2.0), [modelo de datos](docs/database.md), [autenticación](docs/authentication.md), [API y servicios](docs/api.md), [despliegue y CI](docs/deployment.md) y [decisiones técnicas](docs/decisions.md).
- **[`DOCUMENTACION.md`](DOCUMENTACION.md)** — documento académico exhaustivo (también en `.docx`).

## Notas

- Las cuentas de **restaurante no se auto-registran**: el administrador las provisiona por fuera del cliente (Admin SDK / consola), por seguridad. El portal es **solo login**.
- Las reglas de seguridad y las Cloud Functions son la **fuente de verdad en el repo móvil**.

---

<div align="center">
<sub>QuickBite · Proyecto de 9no cuatrimestre · Desarrollo y Gestión de Software</sub>
</div>
