import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { usersService } from '@/services/users.service';

/**
 * Se monta una sola vez (root layout). Sincroniza la sesión de Firebase Auth
 * con el perfil de Firestore en el store. La persistencia la maneja firebase.ts.
 */
export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const unsub = authService.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          let profile = await usersService.getProfile(firebaseUser.uid);
          // Auto-repara: si la sesión existe pero falta el perfil, lo crea.
          if (!profile) {
            await usersService.createProfile(firebaseUser.uid, {
              name: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Usuario',
              email: firebaseUser.email ?? '',
            });
            profile = await usersService.getProfile(firebaseUser.uid);
          }
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch {
        // Sin red al arrancar u otro error de lectura: no reventar. Al recuperar
        // la conexión y navegar, los datos se rehidratan.
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, [setUser, setLoading]);
}

/** Lectura del estado de sesión para las pantallas. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  return { user, loading };
}

export async function signIn(email: string, password: string) {
  await authService.login(email.trim(), password);
}

export async function signUp(name: string, email: string, password: string) {
  const cred = await authService.register(email.trim(), password);
  await usersService.createProfile(cred.user.uid, {
    name: name.trim(),
    email: email.trim(),
  });
  // El listener ya pudo correr con el perfil aún sin crear; lo fijamos aquí.
  const profile = await usersService.getProfile(cred.user.uid);
  useAuthStore.getState().setUser(profile);
}

export async function signOutUser() {
  await authService.logout();
}

/** Login con Google. Devuelve true si inició sesión, false si se canceló. */
export async function signInWithGoogle(): Promise<boolean> {
  const res = await authService.signInWithGoogle();
  return res != null;
}

export async function resetPassword(email: string) {
  await authService.resetPassword(email);
}
