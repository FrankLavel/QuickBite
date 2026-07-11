/**
 * context/PromotionContext.tsx
 * Cupones y banners promocionales del restaurante autenticado.
 */

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getCouponsByRestaurant,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  setCouponActive,
  couponToFormData,
} from '../services/couponService';
import {
  getOffersByRestaurant,
  createOffer,
  updateOffer,
  deleteOffer,
  setOfferActive,
  offerToFormData,
} from '../services/offerService';
import { useAuth } from '../hooks/useAuth';
import type { Coupon, CouponFormData } from '../types/coupon';
import type { Offer, OfferFormData } from '../types/offer';

interface PromotionContextValue {
  coupons: Coupon[];
  offers: Offer[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addCoupon: (form: CouponFormData) => Promise<Coupon>;
  editCoupon: (code: string, form: CouponFormData) => Promise<void>;
  removeCoupon: (code: string) => Promise<void>;
  toggleCoupon: (code: string, isActive: boolean) => Promise<void>;
  addOffer: (form: OfferFormData) => Promise<Offer>;
  editOffer: (offerId: string, form: OfferFormData) => Promise<void>;
  removeOffer: (offerId: string) => Promise<void>;
  toggleOffer: (offerId: string, isActive: boolean) => Promise<void>;
  getCoupon: (code: string) => Coupon | undefined;
  getOffer: (offerId: string) => Offer | undefined;
  getCouponForm: (code: string) => CouponFormData | undefined;
  getOfferForm: (offerId: string) => OfferFormData | undefined;
}

export const PromotionContext = createContext<
  PromotionContextValue | undefined
>(undefined);

export function PromotionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) {
      setCoupons([]);
      setOffers([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [c, o] = await Promise.all([
        getCouponsByRestaurant(restaurantId),
        getOffersByRestaurant(restaurantId),
      ]);
      setCoupons(c);
      setOffers(o);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudieron cargar promociones'
      );
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addCoupon = useCallback(
    async (form: CouponFormData) => {
      if (!restaurantId) throw new Error('Sin restaurante');
      const created = await createCoupon(restaurantId, form);
      setCoupons((prev) => [...prev, created]);
      return created;
    },
    [restaurantId]
  );

  const editCoupon = useCallback(async (code: string, form: CouponFormData) => {
    await updateCoupon(code, form);
    await refresh();
  }, [refresh]);

  const removeCoupon = useCallback(async (code: string) => {
    await deleteCoupon(code);
    setCoupons((prev) => prev.filter((c) => c.code !== code));
  }, []);

  const toggleCoupon = useCallback(async (code: string, isActive: boolean) => {
    await setCouponActive(code, isActive);
    setCoupons((prev) =>
      prev.map((c) => (c.code === code ? { ...c, isActive } : c))
    );
  }, []);

  const addOffer = useCallback(
    async (form: OfferFormData) => {
      if (!restaurantId) throw new Error('Sin restaurante');
      const created = await createOffer(restaurantId, form);
      setOffers((prev) => [...prev, created]);
      return created;
    },
    [restaurantId]
  );

  const editOffer = useCallback(
    async (offerId: string, form: OfferFormData) => {
      if (!restaurantId) throw new Error('Sin restaurante');
      await updateOffer(restaurantId, offerId, form);
      await refresh();
    },
    [restaurantId, refresh]
  );

  const removeOffer = useCallback(async (offerId: string) => {
    await deleteOffer(offerId);
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
  }, []);

  const toggleOffer = useCallback(async (offerId: string, isActive: boolean) => {
    await setOfferActive(offerId, isActive);
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, isActive } : o))
    );
  }, []);

  const getCoupon = useCallback(
    (code: string) => coupons.find((c) => c.code === code),
    [coupons]
  );

  const getOffer = useCallback(
    (offerId: string) => offers.find((o) => o.id === offerId),
    [offers]
  );

  const getCouponForm = useCallback(
    (code: string) => {
      const c = coupons.find((x) => x.code === code);
      return c ? couponToFormData(c) : undefined;
    },
    [coupons]
  );

  const getOfferForm = useCallback(
    (offerId: string) => {
      const o = offers.find((x) => x.id === offerId);
      return o ? offerToFormData(o) : undefined;
    },
    [offers]
  );

  const value = useMemo(
    () => ({
      coupons,
      offers,
      loading,
      error,
      refresh,
      addCoupon,
      editCoupon,
      removeCoupon,
      toggleCoupon,
      addOffer,
      editOffer,
      removeOffer,
      toggleOffer,
      getCoupon,
      getOffer,
      getCouponForm,
      getOfferForm,
    }),
    [
      coupons,
      offers,
      loading,
      error,
      refresh,
      addCoupon,
      editCoupon,
      removeCoupon,
      toggleCoupon,
      addOffer,
      editOffer,
      removeOffer,
      toggleOffer,
      getCoupon,
      getOffer,
      getCouponForm,
      getOfferForm,
    ]
  );

  return (
    <PromotionContext.Provider value={value}>
      {children}
    </PromotionContext.Provider>
  );
}
