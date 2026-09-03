/* eslint-disable import/first -- los jest.mock() van antes de los imports (se hoistean) */
/**
 * Tests de la función PURA offerToFormData — precarga del formulario de ofertas.
 * Se mockean './firebase' y './storageService' para no inicializar Firebase.
 */
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: { fromDate: jest.fn() },
}));
jest.mock('../firebase', () => ({ db: {} }));
jest.mock('../storageService', () => ({ uploadOfferImage: jest.fn() }));

import type { Offer } from '../../types/offer';
import { offerToFormData } from '../offerService';

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: 'o1',
    restaurantId: 'r1',
    type: 'banner',
    badge: 'NUEVO',
    title: 'Promo',
    description: 'desc',
    image: 'https://x/y.jpg',
    isActive: true,
    ...overrides,
  };
}

describe('offerToFormData', () => {
  it('rellena vacíos los campos opcionales de una oferta banner', () => {
    expect(offerToFormData(makeOffer())).toEqual({
      type: 'banner',
      badge: 'NUEVO',
      title: 'Promo',
      description: 'desc',
      image: 'https://x/y.jpg',
      couponCode: '',
      productId: '',
      discountKind: '',
      discountPercent: '',
      startsAt: '',
      endsAt: '',
      isActive: true,
    });
  });

  it('trata una oferta antigua sin type como banner', () => {
    const legacy = { ...makeOffer(), type: undefined } as unknown as Offer;
    expect(offerToFormData(legacy).type).toBe('banner');
  });

  it('convierte el descuento de platillo a texto', () => {
    const dish = makeOffer({
      type: 'dish',
      productId: 'p1',
      discountKind: 'percent',
      discountPercent: 50,
    });
    const form = offerToFormData(dish);
    expect(form.productId).toBe('p1');
    expect(form.discountKind).toBe('percent');
    expect(form.discountPercent).toBe('50');
  });

  it('formatea las fechas de vigencia a YYYY-MM-DD y vacío cuando faltan', () => {
    const withDates = makeOffer({
      startsAt: new Date(2030, 5, 15), // 2030-06-15 (hora local)
      endsAt: null,
    });
    const form = offerToFormData(withDates);
    expect(form.startsAt).toBe('2030-06-15');
    expect(form.endsAt).toBe('');
  });
});
