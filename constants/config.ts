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
  // Openpay (tokenización en el cliente). merchant id + PUBLIC key son seguros
  // en el cliente; la PRIVATE key vive solo en Cloud Functions (Secret Manager).
  openpay: {
    merchantId: process.env.EXPO_PUBLIC_OPENPAY_MERCHANT_ID ?? '',
    publicKey: process.env.EXPO_PUBLIC_OPENPAY_PUBLIC_KEY ?? '',
    sandbox: process.env.EXPO_PUBLIC_OPENPAY_SANDBOX !== 'false',
  },
};
