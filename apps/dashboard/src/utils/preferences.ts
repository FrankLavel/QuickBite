/**
 * utils/preferences.ts
 * Preferencias de la app (cuenta local del dispositivo), persistidas en
 * AsyncStorage. Patrón pub/sub para poder leerlas desde código no-componente
 * (ej. sonido/avisos de pedidos) y desde componentes vía el hook usePreferences.
 */

import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export interface Preferences {
  /** Reproducir un sonido al llegar un pedido nuevo. */
  orderSound: boolean;
  /** Mostrar la tarjeta emergente (toast) al llegar un pedido nuevo. */
  orderToast: boolean;
  /** Reducir/eliminar animaciones de la interfaz. */
  reduceMotion: boolean;
  /** Tema de la app (se aplicará cuando el modo oscuro esté disponible). */
  theme: ThemeMode;
}

const DEFAULTS: Preferences = {
  orderSound: true,
  orderToast: true,
  reduceMotion: false,
  theme: 'light',
};

const STORAGE_KEY = '@quickbite/preferences';

let prefs: Preferences = { ...DEFAULTS };
let listeners: Array<(p: Preferences) => void> = [];

function emit() {
  for (const l of listeners) l(prefs);
}

/** Lectura sincrónica del estado actual (para código no-componente). */
export function getPreferences(): Preferences {
  return prefs;
}

/** Carga inicial desde disco. Llamar una vez al arrancar la app. */
export async function loadPreferences(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      prefs = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) };
      emit();
    }
  } catch {
    // Si falla la lectura, se usan los valores por defecto.
  }
}

export function subscribePreferences(
  listener: (p: Preferences) => void
): () => void {
  listeners.push(listener);
  listener(prefs);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export async function setPreference<K extends keyof Preferences>(
  key: K,
  value: Preferences[K]
): Promise<void> {
  prefs = { ...prefs, [key]: value };
  emit();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Persistencia best-effort; el cambio ya aplica en memoria.
  }
}

/** Hook para componentes: se re-renderiza al cambiar cualquier preferencia. */
export function usePreferences(): Preferences {
  const [state, setState] = useState<Preferences>(prefs);
  useEffect(() => subscribePreferences(setState), []);
  return state;
}
