/**
 * context/AuthContext.tsx
 * Fuente única de verdad de la sesión del repartidor. Escucha onAuthStateChanged y
 * resuelve el perfil (verificando el rol 'driver').
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  loginDriver,
  logoutDriver,
  fetchDriverProfile,
  setAvailability,
  NotADriverError,
} from '../services/authService';
import { clearPushToken } from '../services/pushService';
import type { DriverUser } from '../types/user';

interface AuthContextValue {
  driver: DriverUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleAvailability: (value: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [driver, setDriver] = useState<DriverUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setDriver(null);
        setLoading(false);
        return;
      }
      try {
        setDriver(await fetchDriverProfile(fbUser));
      } catch {
        // Cuenta que no es de repartidor: fetchDriverProfile ya cerró sesión.
        setDriver(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      driver,
      loading,
      async login(email, password) {
        // onAuthStateChanged actualizará el estado; devolvemos para propagar errores.
        await loginDriver(email, password);
      },
      async logout() {
        if (driver) await clearPushToken(driver.uid);
        await logoutDriver();
        setDriver(null);
      },
      async toggleAvailability(next) {
        if (!driver) return;
        await setAvailability(driver.uid, next);
        setDriver({ ...driver, isAvailable: next });
      },
    }),
    [driver, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export { NotADriverError };
