import type { Persistence } from 'firebase/auth';

/**
 * getReactNativePersistence solo se expone en el build de React Native de
 * Firebase. Metro lo resuelve en runtime, pero falta en los typings del subpath
 * `firebase/auth` por defecto. Lo declaramos aquí para conservar el tipado.
 */
declare module 'firebase/auth' {
  export function getReactNativePersistence(
    storage: import('@react-native-async-storage/async-storage').AsyncStorageStatic
  ): Persistence;
}
