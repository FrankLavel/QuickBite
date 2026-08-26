/**
 * context/AuthContext.tsx
 * Sesión global con manejo de errores visible (sin fallos silenciosos).
 */

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { subscribeWebPush } from '../utils/webPush';
import {
  loginRestaurant,
  registerRestaurant,
  logoutRestaurant,
  loadSession,
  loginWithGoogle as loginWithGoogleService,
  loginWithGoogleIdToken,
  updateUserProfile,
  updateRestaurantProfile,
  type RegisterRestaurantInput,
} from '../services/authService';
import {
  saveSessionLocal,
  setRememberDevice,
  clearRememberDevice,
  type CachedSession,
} from '../utils/sessionStorage';
import {
  uploadRestaurantLogo,
  uploadRestaurantCover,
} from '../services/storageService';
import { normalizeImageUrl } from '../utils/imageUrl';
import type { AppUser } from '../types/user';
import type { Restaurant } from '../types/restaurant';

export interface ProfileMediaOptions {
  localLogoUri?: string;
  logoImageURL?: string;
  localCoverUri?: string;
  coverImageURL?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  restaurant: Restaurant | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;
  register: (data: RegisterRestaurantInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    userUpdates?: Partial<Pick<AppUser, 'name' | 'phone' | 'photoURL'>>,
    restaurantUpdates?: Partial<Restaurant>,
    media?: ProfileMediaOptions
  ) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

async function applySession(
  session: CachedSession,
  remember = true
): Promise<void> {
  await saveSessionLocal(session);
  if (remember) {
    await setRememberDevice(true);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Evita que onAuthStateChanged pise errores durante login/register manual */
  const authActionRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (authActionRef.current) return;

      try {
        if (fbUser) {
          const session = await loadSession(fbUser);
          setUser(session.user);
          setRestaurant(session.restaurant);
          await saveSessionLocal(session);
          setError(null);
        } else {
          setUser(null);
          setRestaurant(null);
          await saveSessionLocal(null);
        }
      } catch (err) {
        setUser(null);
        setRestaurant(null);
        if (fbUser) {
          const message =
            err instanceof Error ? err.message : 'No se pudo cargar tu sesión';
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Al haber restaurante autenticado (en web), suscribe el dashboard a Web Push
  // para recibir avisos de pedidos nuevos con la pestaña cerrada.
  useEffect(() => {
    if (user?.uid) void subscribeWebPush(user.uid);
  }, [user?.uid]);

  const login = useCallback(
    async (email: string, password: string, remember = true) => {
      authActionRef.current = true;
      setError(null);
      setLoading(true);
      try {
        const session = await loginRestaurant(email, password);
        setUser(session.user);
        setRestaurant(session.restaurant);
        if (remember) {
          await applySession(session, true);
        } else {
          await saveSessionLocal(session);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error al iniciar sesión';
        setError(message);
        throw err;
      } finally {
        authActionRef.current = false;
        setLoading(false);
      }
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    authActionRef.current = true;
    setError(null);
    setLoading(true);
    try {
      const session = await loginWithGoogleService();
      setUser(session.user);
      setRestaurant(session.restaurant);
      await applySession(session, true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al iniciar con Google';
      setError(message);
      throw err;
    } finally {
      authActionRef.current = false;
      setLoading(false);
    }
  }, []);

  const loginWithGoogleToken = useCallback(async (idToken: string) => {
    authActionRef.current = true;
    setError(null);
    setLoading(true);
    try {
      const session = await loginWithGoogleIdToken(idToken);
      setUser(session.user);
      setRestaurant(session.restaurant);
      await applySession(session, true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al iniciar con Google';
      setError(message);
      throw err;
    } finally {
      authActionRef.current = false;
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRestaurantInput) => {
    authActionRef.current = true;
    setError(null);
    setLoading(true);
    try {
      const session = await registerRestaurant(data);
      setUser(session.user);
      setRestaurant(session.restaurant);
      await applySession(session, true);
    } catch (err) {
      try {
        await logoutRestaurant();
      } catch {
        // limpiar sesión parcial si el registro falló a medias
      }
      const message =
        err instanceof Error ? err.message : 'Error al registrarse';
      setError(message);
      throw err;
    } finally {
      authActionRef.current = false;
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    authActionRef.current = true;
    setLoading(true);
    try {
      await logoutRestaurant();
      setUser(null);
      setRestaurant(null);
      await saveSessionLocal(null);
      await clearRememberDevice();
      setError(null);
    } finally {
      authActionRef.current = false;
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (
      userUpdates?: Partial<Pick<AppUser, 'name' | 'phone' | 'photoURL'>>,
      restaurantUpdates?: Partial<Restaurant>,
      media?: ProfileMediaOptions
    ) => {
      if (!user?.restaurantId) return;

      let logoImage = normalizeImageUrl(restaurantUpdates?.logoImage) ?? '';

      if (media?.localLogoUri) {
        logoImage = await uploadRestaurantLogo(
          user.restaurantId,
          media.localLogoUri
        );
      } else if (media?.logoImageURL?.trim()) {
        logoImage = normalizeImageUrl(media.logoImageURL) ?? '';
      }

      let coverImage = normalizeImageUrl(restaurantUpdates?.coverImage) ?? '';

      if (media?.localCoverUri) {
        coverImage = await uploadRestaurantCover(
          user.restaurantId,
          media.localCoverUri
        );
      } else if (media?.coverImageURL?.trim()) {
        coverImage = normalizeImageUrl(media.coverImageURL) ?? '';
      }

      const hasLogo = Boolean(logoImage);
      const hasCover = Boolean(coverImage);
      const finalRestaurantUpdates: Partial<Restaurant> = {
        ...restaurantUpdates,
        ...(hasLogo ? { logoImage } : {}),
        ...(hasCover ? { coverImage } : {}),
      };
      const finalUserUpdates: Partial<Pick<AppUser, 'name' | 'phone' | 'photoURL'>> = {
        ...userUpdates,
        ...(hasLogo ? { photoURL: logoImage } : {}),
      };

      if (Object.keys(finalUserUpdates).length > 0) {
        await updateUserProfile(user.uid, finalUserUpdates);
        setUser((prev) => (prev ? { ...prev, ...finalUserUpdates } : prev));
      }

      if (Object.keys(finalRestaurantUpdates).length > 0) {
        await updateRestaurantProfile(user.restaurantId, finalRestaurantUpdates);
        setRestaurant((prev) =>
          prev ? { ...prev, ...finalRestaurantUpdates } : prev
        );
      }

      const nextUser =
        Object.keys(finalUserUpdates).length > 0
          ? { ...user, ...finalUserUpdates }
          : user;
      const nextRestaurant = restaurant
        ? Object.keys(finalRestaurantUpdates).length > 0
          ? { ...restaurant, ...finalRestaurantUpdates }
          : restaurant
        : null;

      await saveSessionLocal({
        user: nextUser,
        restaurant: nextRestaurant,
      });
    },
    [user, restaurant]
  );

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      restaurant,
      loading,
      error,
      login,
      loginWithGoogle,
      loginWithGoogleIdToken: loginWithGoogleToken,
      register,
      logout,
      updateProfile,
      clearError,
    }),
    [
      user,
      restaurant,
      loading,
      error,
      login,
      loginWithGoogle,
      loginWithGoogleToken,
      register,
      logout,
      updateProfile,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
