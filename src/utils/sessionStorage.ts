/**
 * sessionStorage.ts
 * Persistencia de sesión: SecureStore (móvil) / AsyncStorage (web).
 * SecureStore no funciona en navegador y rompía el login silenciosamente.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from './constants';
import type { AppUser } from '../types/user';
import type { Restaurant } from '../types/restaurant';

export interface CachedSession {
  user: AppUser;
  restaurant: Restaurant | null;
}

export async function saveSessionLocal(
  session: CachedSession | null
): Promise<void> {
  try {
    if (session) {
      const json = JSON.stringify(session);
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, json);
      } else {
        await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_USER, json);
      }
    } else if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_USER);
    }
  } catch (error) {
    console.warn('[QuickBite] No se pudo guardar sesión local:', error);
  }
}

export async function setRememberDevice(enabled: boolean): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (enabled) {
        await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_DEVICE, 'true');
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_DEVICE);
      }
      return;
    }
    if (enabled) {
      await SecureStore.setItemAsync(STORAGE_KEYS.REMEMBER_DEVICE, 'true');
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REMEMBER_DEVICE);
    }
  } catch {
    // No bloquear el flujo de auth
  }
}

export async function clearRememberDevice(): Promise<void> {
  await setRememberDevice(false);
}
