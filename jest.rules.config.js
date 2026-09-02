// Jest para los tests de Security Rules: corren en Node contra el emulador de
// Firestore (sin el preset RN de jest-expo). Se lanzan con `npm run test:rules`,
// que arranca el emulador vía `firebase emulators:exec`.
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/firestore-tests/**/*.test.js'],
  // Los tests son CommonJS plano; sin transform para no arrastrar Babel/Expo.
  transform: {},
  testTimeout: 20000,
};
