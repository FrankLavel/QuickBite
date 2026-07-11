// Configuración de Babel para Expo.
// Preset oficial que transpila TypeScript y JSX para React Native.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
