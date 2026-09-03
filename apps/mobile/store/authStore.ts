import { create } from 'zustand';
import { User } from '@/types/user.types';

interface AuthState {
  user: User | null;
  loading: boolean;
  // Metadatos que viven en el usuario de Firebase Auth (no en el perfil de
  // Firestore): se usan para el bloqueo por correo sin verificar.
  emailVerified: boolean;
  authEmail: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthMeta: (meta: { emailVerified: boolean; authEmail: string | null }) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  emailVerified: false,
  authEmail: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setAuthMeta: (meta) => set(meta),
}));
