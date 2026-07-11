// Extiende app.json para inyectar la API key de Google Maps (desde .env) y el
// permiso de ubicación. La key NO se hardcodea: viene de GOOGLE_MAPS_API_KEY.
// Requiere un dev build (npx expo run:android / run:ios) — Expo Go no aplica
// esta configuración nativa.

const fs = require('fs');

const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
// Requerido para recibir push en Android (FCM). Descárgalo de Firebase →
// app Android → google-services.json y colócalo en la raíz del proyecto.
const googleServicesFile = fs.existsSync('./google-services.json')
  ? './google-services.json'
  : undefined;

export default ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    config: {
      ...(config.ios?.config ?? {}),
      googleMapsApiKey: mapsKey,
    },
  },
  android: {
    ...config.android,
    googleServicesFile,
    config: {
      ...(config.android?.config ?? {}),
      googleMaps: { apiKey: mapsKey },
    },
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'QuickBite usa tu ubicación para sugerir tu dirección de entrega.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'QuickBite accede a tus fotos para que elijas tu foto de perfil.',
      },
    ],
    '@react-native-google-signin/google-signin',
  ],
});
