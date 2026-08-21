import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
  sendEmailVerification,
  UserCredential,
  User,
} from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// webClientId: OAuth client de tipo "Web" del proyecto en Firebase/Google Cloud.
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export const authService = {
  login: (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password),

  register: (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password),

  logout: async () => {
    // Cierra también la sesión de Google para que el próximo login muestre el
    // selector de cuenta (si no, reusa la cuenta anterior en silencio).
    try {
      await GoogleSignin.signOut();
    } catch {
      // no había sesión de Google (login por correo): se ignora
    }
    await signOut(auth);
  },

  resetPassword: (email: string) => sendPasswordResetEmail(auth, email.trim()),

  /** Envía (o reenvía) el correo de verificación al usuario actual. */
  sendVerification: () => {
    const user = auth.currentUser;
    if (!user) throw new Error('no-user');
    return sendEmailVerification(user);
  },

  /**
   * Refresca el usuario desde el servidor y devuelve si el correo ya quedó
   * verificado. Se usa tras pedirle al usuario que abra el enlace del correo.
   */
  reloadUser: async (): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;
    await user.reload();
    return auth.currentUser?.emailVerified ?? false;
  },

  /** Login con Google. Devuelve la credencial o null si el usuario cancela. */
  signInWithGoogle: async (): Promise<UserCredential | null> => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (res.type !== 'success') return null; // cancelado
    const idToken = res.data.idToken;
    if (!idToken) throw new Error('google-no-id-token');
    const credential = GoogleAuthProvider.credential(idToken);
    return signInWithCredential(auth, credential);
  },

  onAuthStateChanged: (callback: (user: User | null) => void) =>
    onAuthStateChanged(auth, callback),

  /** true si la cuenta tiene proveedor de correo/contraseña (no solo Google). */
  hasPasswordProvider: () =>
    auth.currentUser?.providerData.some((p) => p.providerId === 'password') ?? false,

  /** Cambia la contraseña. Re-autentica con la contraseña actual (Firebase lo exige). */
  changePassword: async (currentPassword: string, newPassword: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('no-user');
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);
  },

  /**
   * Elimina la cuenta: re-autentica (según proveedor), borra el perfil de
   * Firestore y luego el usuario de Auth. Los pedidos/reseñas históricos quedan
   * referenciando el uid eliminado (no se borran en cascada desde el cliente).
   */
  deleteAccount: async (currentPassword?: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('no-user');

    const isPassword = user.providerData.some((p) => p.providerId === 'password');
    if (isPassword) {
      if (!currentPassword || !user.email) throw new Error('need-password');
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, currentPassword)
      );
    } else {
      // Google: re-autenticar con una credencial fresca.
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const res = await GoogleSignin.signIn();
      if (res.type !== 'success' || !res.data.idToken) throw new Error('reauth-cancelled');
      await reauthenticateWithCredential(user, GoogleAuthProvider.credential(res.data.idToken));
    }

    await deleteDoc(doc(db, 'users', user.uid));
    await deleteUser(user);
    try {
      await GoogleSignin.signOut();
    } catch {
      // no había sesión de Google
    }
  },
};
