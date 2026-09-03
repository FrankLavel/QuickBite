// Extiende app.json para inyectar google-services.json (FCM) en el build de
// Android. El repartidor recibe push (avisos de pedidos disponibles) vía Expo
// Push, que en Android necesita FCM: sin este archivo el token falla con
// "DeviceNotRegistered".
//
// En EAS, google-services.json NO va en el repo (gitignored): se inyecta como
// variable de entorno tipo "file" (GOOGLE_SERVICES_JSON = ruta al archivo).
// En local se usa el archivo del repo (./google-services.json).
//
// Requiere un dev build o build de EAS — Expo Go no aplica esta config nativa.

const fs = require('fs');

const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ||
  (fs.existsSync('./google-services.json') ? './google-services.json' : undefined);

export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile,
  },
});
