import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Lang = 'es' | 'en';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

/** Idioma de la app, persistido en el dispositivo. Default: español. */
export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: 'es',
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'quickbite-lang',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
