import { db } from '@/lib/firebase';
import { collection, getDocs, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Offer } from '@/types/offer.types';

/** ¿La oferta está dentro de su ventana de vigencia (si definió fechas)? */
function isWithinWindow(o: Offer): boolean {
  const now = Date.now();
  const start = o.startsAt?.toMillis?.();
  const end = o.endsAt?.toMillis?.();
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

/** Activa y vigente = se muestra en el Home. */
const visible = (o: Offer) => o.isActive && isWithinWindow(o);

export const offersService = {
  /** Ofertas visibles para el Home (filtrado en cliente, sin índice). */
  getActiveOffers: async (): Promise<Offer[]> => {
    const snap = await getDocs(collection(db, 'offers'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Offer))
      .filter(visible);
  },

  /** Escucha en tiempo real las ofertas visibles (el Home se actualiza solo). */
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
            .filter(visible)
        ),
      (error) => onError?.(error)
    ),
};
