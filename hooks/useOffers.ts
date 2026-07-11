import { useState, useEffect } from 'react';
import { Offer } from '@/types/offer.types';
import { offersService } from '@/services/offers.service';

/** Ofertas activas para el Home. */
export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    offersService
      .getActiveOffers()
      .then((data) => active && setOffers(data))
      .catch(() => active && setOffers([])) // sin red / error: sin ofertas, no revienta
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { offers, loading };
}
