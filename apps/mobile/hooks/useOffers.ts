import { useState, useEffect } from 'react';
import { Offer } from '@/types/offer.types';
import { offersService } from '@/services/offers.service';

/** Ofertas activas para el Home, en tiempo real. */
export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = offersService.listenActiveOffers(
      (data) => {
        setOffers(data);
        setLoading(false);
      },
      () => {
        setOffers([]); // sin red / error: sin ofertas, no revienta
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { offers, loading };
}
