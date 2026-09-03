// Configuración de Jest para la app Driver (Expo SDK 54).
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@quickbite/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|firebase|@firebase/.*))',
  ],
  collectCoverageFrom: [
    'src/utils/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
};
