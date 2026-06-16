import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getAuthErrorMessage } from '@/lib/auth-errors';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  isGoogleConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Configura Firebase en tu archivo .env antes de iniciar sesión.');
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Configura Firebase en tu archivo .env antes de crear una cuenta.');
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: fullName.trim() });
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      throw new Error('Ingresa tu correo electrónico.');
    }

    if (!isFirebaseConfigured()) {
      throw new Error('Configura Firebase en tu archivo .env antes de recuperar la contraseña.');
    }

    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Configura Firebase en tu archivo .env antes de iniciar sesión.');
    }

    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }, []);

  const isGoogleConfigured = Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isConfigured: isFirebaseConfigured(),
      isGoogleConfigured,
      signIn,
      signUp,
      signInWithGoogle,
      resetPassword,
      signOut,
    }),
    [user, isLoading, isGoogleConfigured, signIn, signUp, signInWithGoogle, resetPassword, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}
