import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { SavedCard } from '@/types/card.types';

/**
 * Tarjetas guardadas del usuario (users/{uid}/cards) en tiempo real.
 * La predeterminada primero. Solo lectura; se crean/borran vía Cloud Functions.
 */
export function useSavedCards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = user?.uid ?? auth.currentUser?.uid;
    if (!uid) {
      setCards([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'cards'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedCard));
        list.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
        setCards(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [user?.uid]);

  return { cards, loading };
}
