import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface A11yState {
  /** Tema de alto contraste en toda la app. */
  highContrast: boolean;
  /** Texto más grande en toda la app. */
  largeText: boolean;
  setHighContrast: (v: boolean) => void;
  setLargeText: (v: boolean) => void;
}

/**
 * Preferencias de accesibilidad, persistidas en el dispositivo (no en Firestore:
 * la accesibilidad es por dispositivo). Las consume el root layout para aplicar
 * el tema de alto contraste y la escala de texto en toda la app.
 */
export const useA11yStore = create<A11yState>()(
  persist(
    (set) => ({
      highContrast: false,
      largeText: false,
      setHighContrast: (highContrast) => set({ highContrast }),
      setLargeText: (largeText) => set({ largeText }),
    }),
    {
      name: 'quickbite-a11y',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
