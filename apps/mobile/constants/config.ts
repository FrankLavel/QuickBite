export const config = {
  requestTimeout: 10_000,
  maxCartItems: 50,
  deliveryRadiusKm: 15,
  texts: {
    appName: 'QuickBite',
    tagline: 'Tu comida, rápido.',
  },
  support: {
    // Número de WhatsApp de soporte en formato internacional SIN '+' ni espacios
    // (código de país + número).
    whatsapp: '527205561990',
  },
  // Google Geocoding API (resolución de direcciones desde el cliente). Es la
  // fuente principal en lib/geocode.ts por su precisión; si la key no está o la
  // API no responde, se cae a Nominatim y al geocoder nativo. La key debe tener
  // habilitada "Geocoding API" en Google Cloud (+ billing).
  maps: {
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  },
  // Openpay (tokenización en el cliente). merchant id + PUBLIC key son seguros
  // en el cliente; la PRIVATE key vive solo en Cloud Functions (Secret Manager).
  openpay: {
    merchantId: process.env.EXPO_PUBLIC_OPENPAY_MERCHANT_ID ?? '',
    publicKey: process.env.EXPO_PUBLIC_OPENPAY_PUBLIC_KEY ?? '',
    sandbox: process.env.EXPO_PUBLIC_OPENPAY_SANDBOX !== 'false',
  },
};
