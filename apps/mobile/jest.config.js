// Configuración de Jest para la app cliente (Expo SDK 54 + NativeWind).
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@quickbite/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-router|@react-navigation/.*|firebase|@firebase/.*|nativewind|react-native-css-interop))',
  ],
  // Los tests de Security Rules usan su propio config (jest.rules.config.js) y el
  // emulador; no deben correr en la suite RN.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/firestore-tests/'],
  collectCoverageFrom: ['lib/**/*.ts', '!lib/**/__tests__/**'],
};
