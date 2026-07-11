import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { Address, User } from '@/types/user.types';

const userRef = (uid: string) => doc(db, 'users', uid);

/** Campos del perfil que el cliente puede editar libremente. */
type EditableProfile = Partial<Pick<User, 'name' | 'phone' | 'photoURL' | 'darkMode'>>;

export const usersService = {
  /** Lee el documento /users/{uid}. null si aún no existe. */
  getProfile: async (uid: string): Promise<User | null> => {
    const snap = await getDoc(userRef(uid));
    return snap.exists() ? ({ uid: snap.id, ...snap.data() } as User) : null;
  },

  /** Crea el perfil tras el registro. role siempre 'customer'. */
  createProfile: (
    uid: string,
    data: { name: string; email: string; phone?: string }
  ) =>
    setDoc(userRef(uid), {
      name: data.name,
      email: data.email,
      phone: data.phone ?? '',
      photoURL: '',
      role: 'customer',
      addresses: [],
      favoriteIds: [],
      favoriteProductIds: [],
      darkMode: false,
      createdAt: serverTimestamp(),
    }),

  updateProfile: (uid: string, data: EditableProfile) =>
    updateDoc(userRef(uid), data),

  // — Direcciones (array de maps) —
  addAddress: (uid: string, address: Address) =>
    updateDoc(userRef(uid), { addresses: arrayUnion(address) }),

  removeAddress: (uid: string, address: Address) =>
    updateDoc(userRef(uid), { addresses: arrayRemove(address) }),

  /**
   * Reemplaza el array completo de direcciones. Necesario para alternar
   * isDefault, ya que arrayUnion/arrayRemove no editan maps existentes.
   */
  setAddresses: (uid: string, addresses: Address[]) =>
    updateDoc(userRef(uid), { addresses }),

  // — Favoritos —
  addFavorite: (uid: string, restaurantId: string) =>
    updateDoc(userRef(uid), { favoriteIds: arrayUnion(restaurantId) }),

  removeFavorite: (uid: string, restaurantId: string) =>
    updateDoc(userRef(uid), { favoriteIds: arrayRemove(restaurantId) }),

  // — Platillos favoritos (clave "restaurantId|productId") —
  addFavoriteProduct: (uid: string, key: string) =>
    updateDoc(userRef(uid), { favoriteProductIds: arrayUnion(key) }),

  removeFavoriteProduct: (uid: string, key: string) =>
    updateDoc(userRef(uid), { favoriteProductIds: arrayRemove(key) }),

  // — Preferencias / push —
  setDarkMode: (uid: string, darkMode: boolean) =>
    updateDoc(userRef(uid), { darkMode }),

  setPushToken: (uid: string, pushToken: string) =>
    updateDoc(userRef(uid), { pushToken }),
};
