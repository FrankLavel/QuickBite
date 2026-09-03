<div align="center">

# 🍔 QuickBite · App del Cliente

**App móvil (Android) para pedir en las fondas de QuickBite.**

Descubre restaurantes, arma tu pedido, paga y sigue la entrega en tiempo real.

</div>

---

## ¿Qué es esto?

QuickBite es una plataforma de pedidos a domicilio pensada para apoyar a las fondas de Michoacán, con una **comisión del 7%** (frente al 15–30% de las plataformas grandes). El ecosistema tiene **dos aplicaciones** sobre un mismo backend en la nube:

- **App móvil del cliente** (este repositorio) — Android.
- **Portal del Restaurante** (web) — [repositorio aparte](https://github.com/FrankLavel/Quick_web).

Este repositorio también contiene el **backend** (`functions/`, Cloud Functions) y las **reglas de Firestore** (`firestore.rules`), que son la fuente de verdad de todo el ecosistema.

> Proyecto escolar, funcional y desplegado en **modo de pruebas (sandbox)**.

## Funcionalidades

- 🛒 **Catálogo y carrito** de un solo restaurante, con búsqueda y categorías.
- 💳 **Pagos con Openpay** — tarjeta, tarjetas guardadas de un toque y efectivo, con **reembolso automático** si se rechaza el pedido.
- 📍 **Cobertura de reparto** — valida por distancia que estés dentro de la zona del restaurante.
- 🔔 **Notificaciones push** del estado del pedido en tiempo real.
- ✉️ **Verificación de correo obligatoria** al registrarse (bloqueo estricto).
- 🔗 **Compartir** platillos con vista previa (Open Graph).
- 🌙 **Modo oscuro**, **español/inglés** y opciones de accesibilidad.

## Tecnologías

| | |
|---|---|
| **Framework** | Expo `~54` · Expo Router · TypeScript |
| **Estilos** | NativeWind (Tailwind) |
| **Estado** | Zustand |
| **Backend** | Firebase (Auth, Firestore, Cloud Functions, Cloud Messaging) |
| **Pagos** | Openpay (sandbox) |
| **Builds / OTA** | EAS Build · EAS Update |

## Requisitos

- Node.js 18+
- Un proyecto de **Firebase** y credenciales de **Openpay** (sandbox)
- **Dev build** de EAS: la app usa módulos nativos (WebView, mapas, Google Sign-In), así que **no corre en Expo Go**.

## Instalación

```bash
git clone https://github.com/FrankLavel/Quick_mobil.git
cd Quick_mobil
npm install
```

### Variables de entorno

Copia la plantilla y rellena tus credenciales (el `.env` real está en `.gitignore`):

```bash
cp .env.example .env
```

Incluye Firebase, Google Maps, Google Sign-In y las llaves **públicas** de Openpay. La **llave privada de Openpay nunca va aquí** — vive en los secretos de Cloud Functions:

```bash
firebase functions:secrets:set OPENPAY_PRIVATE_KEY
```

## Scripts

```bash
npm start            # inicia el bundler de Expo
npm run android      # compila y corre el dev build en Android
npx expo start -c    # inicia limpiando la caché (tras cambiar el .env)
```

## Builds y actualizaciones (EAS)

```bash
# APK instalable para compartir/probar
eas build -p android --profile preview

# Actualización OTA (solo cambios de JavaScript, sin reconstruir)
eas update --branch preview --platform android
```

> Solo se necesita **rebuild** cuando cambian módulos o config nativa (íconos, permisos, `app.config.js`). Los cambios de JavaScript se publican por **OTA**.

## Backend

```bash
cd functions
npm install
firebase deploy --only functions      # despliega las Cloud Functions
firebase deploy --only firestore:rules # despliega las reglas de seguridad
```

## Notas

- Las cuentas de **restaurante se provisionan por fuera del cliente** (Admin SDK). Hay un script de ayuda: `node scripts/crear-restaurante.mjs <correo> <contraseña> "<Nombre>"` (requiere `scripts/serviceAccount.json`, que está en `.gitignore`).
- Los archivos sensibles (`.env`, `google-services.json`, `serviceAccount.json`) están ignorados por Git — **nunca se commitean**.

---

<div align="center">
<sub>QuickBite · Proyecto de 9no cuatrimestre · Desarrollo y Gestión de Software</sub>
</div>
