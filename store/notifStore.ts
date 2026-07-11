import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotifState {
  /** Preferencia del usuario para recibir notificaciones push. */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

/**
 * Preferencia de notificaciones push, persistida en el dispositivo. Default: on.
 * La consume usePushNotifications para registrar o limpiar el token Expo.
 */
export const useNotifStore = create<NotifState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: 'quickbite-notif',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
