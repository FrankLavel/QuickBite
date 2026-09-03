/* eslint-disable import/first -- los jest.mock() van antes de los imports (se hoistean) */
/**
 * Tests de las funciones PURAS de couponService — normalización de código y
 * reglas de canje (mismo criterio que firestore.rules). No tocan Firestore:
 * se mockea './firebase' para evitar inicializar la app.
 */
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: { fromDate: jest.fn() },
}));
jest.mock('../firebase', () => ({ db: {} }));

import type { Coupon } from '../../types/coupon';
import {
  normalizeCouponCode,
  couponToFormData,
  isCouponExpired,
  isCouponExhausted,
  getCouponRedemptionBlockReason,
  canRedeemCoupon,
} from '../couponService';

function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    code: 'SAVE20',
    restaurantId: 'r1',
    type: 'percent',
    value: 20,
    minOrder: 100,
    maxUses: 10,
    usedCount: 0,
    expiresAt: null,
    isActive: true,
    ...overrides,
  };
}

const DAY = 24 * 60 * 60 * 1000;

describe('normalizeCouponCode', () => {
  it('recorta, pasa a mayúsculas y quita espacios internos', () => {
    expect(normalizeCouponCode('  save 20 ')).toBe('SAVE20');
    expect(normalizeCouponCode('ab cd')).toBe('ABCD');
  });
});

describe('couponToFormData', () => {
  it('convierte números a texto y fecha a YYYY-MM-DD', () => {
    const coupon = makeCoupon({
      expiresAt: new Date(Date.UTC(2030, 5, 15, 12)), // 2030-06-15
      value: 20,
      minOrder: 100,
      maxUses: 10,
    });
    expect(couponToFormData(coupon)).toEqual({
      code: 'SAVE20',
      type: 'percent',
      value: '20',
      minOrder: '100',
      maxUses: '10',
      expiresAt: '2030-06-15',
      isActive: true,
    });
  });

  it('deja expiresAt vacío cuando no hay fecha', () => {
    expect(couponToFormData(makeCoupon({ expiresAt: null })).expiresAt).toBe('');
  });
});

describe('isCouponExpired', () => {
  it('sin fecha nunca expira', () => {
    expect(isCouponExpired(makeCoupon({ expiresAt: null }))).toBe(false);
  });

  it('expira con fecha pasada y no con futura', () => {
    expect(
      isCouponExpired(makeCoupon({ expiresAt: new Date(Date.now() - DAY) }))
    ).toBe(true);
    expect(
      isCouponExpired(makeCoupon({ expiresAt: new Date(Date.now() + DAY) }))
    ).toBe(false);
  });
});

describe('isCouponExhausted', () => {
  it('se agota cuando usedCount alcanza maxUses', () => {
    expect(isCouponExhausted(makeCoupon({ usedCount: 10, maxUses: 10 }))).toBe(
      true
    );
    expect(isCouponExhausted(makeCoupon({ usedCount: 9, maxUses: 10 }))).toBe(
      false
    );
  });
});

describe('getCouponRedemptionBlockReason', () => {
  it('devuelve null cuando el cupón es válido', () => {
    expect(getCouponRedemptionBlockReason(makeCoupon())).toBeNull();
  });

  it('prioriza inactive sobre cualquier otro motivo', () => {
    const coupon = makeCoupon({
      isActive: false,
      expiresAt: new Date(Date.now() - DAY),
      usedCount: 10,
      maxUses: 10,
    });
    expect(getCouponRedemptionBlockReason(coupon)).toBe('inactive');
  });

  it('prioriza expired sobre exhausted', () => {
    const coupon = makeCoupon({
      expiresAt: new Date(Date.now() - DAY),
      usedCount: 10,
      maxUses: 10,
    });
    expect(getCouponRedemptionBlockReason(coupon)).toBe('expired');
  });

  it('reporta exhausted cuando solo está agotado', () => {
    expect(
      getCouponRedemptionBlockReason(makeCoupon({ usedCount: 10, maxUses: 10 }))
    ).toBe('exhausted');
  });
});

describe('canRedeemCoupon', () => {
  it('solo es canjeable cuando no hay motivo de bloqueo', () => {
    expect(canRedeemCoupon(makeCoupon())).toBe(true);
    expect(canRedeemCoupon(makeCoupon({ isActive: false }))).toBe(false);
  });
});
