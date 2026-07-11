import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Offer } from '@/types/offer.types';

export const offersService = {
  /** Ofertas activas para mostrar en el Home (filtrado en cliente, sin índice). */
  getActiveOffers: async (): Promise<Offer[]> => {
    const snap = await getDocs(collection(db, 'offers'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Offer))
      .filter((o) => o.isActive);
  },
};
