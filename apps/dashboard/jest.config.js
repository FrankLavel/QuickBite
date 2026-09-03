// Configuración de Jest para el dashboard (Expo SDK 53).
// Usa el preset oficial jest-expo, que aplica babel-preset-expo a los tests y
// mockea los módulos nativos de Expo/React Native.
module.exports = {
  preset: 'jest-expo',
  // Alias "@/..." → "src/..." (mismo que tsconfig.json).
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Solo transpila las libs de RN/Expo/Firebase que se publican en ESM.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|firebase|@firebase/.*))',
  ],
  // Reporte de cobertura sobre la lógica de negocio.
  collectCoverageFrom: [
    'src/utils/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
};
