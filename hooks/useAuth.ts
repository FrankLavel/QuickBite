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
        // Metadatos de verificación de correo (Google llega ya verificado).
        useAuthStore.getState().setAuthMeta({
          emailVerified: firebaseUser?.emailVerified ?? false,
          authEmail: firebaseUser?.email ?? null,
        });
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

/**
 * Estado del bloqueo por correo sin verificar. `needsVerification` es true
 * cuando hay una sesión de correo/contraseña cuyo correo aún no se confirma.
 * (Las cuentas de Google llegan con emailVerified=true, así que nunca se bloquean.)
 */
export function useEmailGate() {
  const emailVerified = useAuthStore((s) => s.emailVerified);
  const authEmail = useAuthStore((s) => s.authEmail);
  return {
    emailVerified,
    authEmail,
    needsVerification: !!authEmail && !emailVerified,
  };
}

export async function signIn(email: string, password: string) {
  await authService.login(email.trim(), password);
}

export async function signUp(
  name: string,
  phone: string,
  email: string,
  password: string
) {
  const cred = await authService.register(email.trim(), password);
  await usersService.createProfile(cred.user.uid, {
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
  });
  // Envía el correo de verificación. Si falla (p. ej. sin red), no rompemos el
  // registro: la pantalla de verificación tiene botón para reenviar.
  try {
    await authService.sendVerification();
  } catch {
    // se reintenta desde la pantalla de verificación
  }
  // El listener ya pudo correr con el perfil aún sin crear; lo fijamos aquí.
  const profile = await usersService.getProfile(cred.user.uid);
  useAuthStore.getState().setUser(profile);
}

/** Reenvía el correo de verificación al usuario actual. */
export async function resendVerification() {
  await authService.sendVerification();
}

/** Refresca desde el servidor y devuelve si el correo ya está verificado. */
export async function refreshEmailVerified(): Promise<boolean> {
  const verified = await authService.reloadUser();
  useAuthStore.getState().setAuthMeta({
    emailVerified: verified,
    authEmail: useAuthStore.getState().authEmail,
  });
  return verified;
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
