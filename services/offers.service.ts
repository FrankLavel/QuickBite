import { db } from '@/lib/firebase';
import { collection, getDocs, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Offer } from '@/types/offer.types';

export const offersService = {
  /** Ofertas activas para mostrar en el Home (filtrado en cliente, sin índice). */
  getActiveOffers: async (): Promise<Offer[]> => {
    const snap = await getDocs(collection(db, 'offers'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Offer))
      .filter((o) => o.isActive);
  },

  /** Escucha en tiempo real las ofertas activas (el Home se actualiza solo). */
  listenActiveOffers: (
    onData: (offers: Offer[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe =>
    onSnapshot(
      collection(db, 'offers'),
      (snap) =>
        onData(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Offer))
            .filter((o) => o.isActive)
        ),
      (error) => onError?.(error)
    ),
};
