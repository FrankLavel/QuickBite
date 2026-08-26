// Configuración de Jest para la app cliente (Expo SDK 54 + NativeWind).
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-router|@react-navigation/.*|firebase|@firebase/.*|nativewind|react-native-css-interop))',
  ],
  collectCoverageFrom: ['lib/**/*.ts', '!lib/**/__tests__/**'],
};
