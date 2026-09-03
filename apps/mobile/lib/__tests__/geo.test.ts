/**
 * Tests de lib/geo.ts — distancia Haversine y verificación de zona de reparto.
 */
import { distanceKm, hasValidCoords, checkDeliveryCoverage } from '../geo';
import type { Restaurant } from '@/types/restaurant.types';

function restaurant(
  location: { latitude: number; longitude: number } | undefined,
  deliveryZone: number | undefined
): Restaurant {
  return { location, deliveryZone } as unknown as Restaurant;
}

describe('distanceKm', () => {
  it('es 0 para el mismo punto', () => {
    expect(distanceKm({ lat: 19.4, lng: -99.1 }, { lat: 19.4, lng: -99.1 })).toBe(0);
  });
  it('~111 km por un grado de longitud en el ecuador', () => {
    const d = distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });
});

describe('hasValidCoords', () => {
  it('rechaza null, (0,0) y no finitos', () => {
    expect(hasValidCoords(null)).toBe(false);
    expect(hasValidCoords({ lat: 0, lng: 0 })).toBe(false);
    expect(hasValidCoords({ lat: NaN, lng: 1 })).toBe(false);
    expect(hasValidCoords({ lat: 19.4, lng: -99.1 })).toBe(true);
  });
});

describe('checkDeliveryCoverage', () => {
  const loc = { latitude: 19.4326, longitude: -99.1332 };

  it('falla EN ABIERTO si falta ubicación, zona o coords de la dirección', () => {
    expect(checkDeliveryCoverage(restaurant(undefined, 5), { lat: 19.44, lng: -99.14 }).ok).toBe(true);
    expect(checkDeliveryCoverage(restaurant(loc, 0), { lat: 19.44, lng: -99.14 }).ok).toBe(true);
    expect(checkDeliveryCoverage(restaurant(loc, 5), null).ok).toBe(true);
    expect(checkDeliveryCoverage(restaurant(loc, 5), { lat: 0, lng: 0 }).ok).toBe(true);
  });

  it('acepta dentro del radio y rechaza fuera', () => {
    const near = checkDeliveryCoverage(restaurant(loc, 5), { lat: 19.44, lng: -99.14 });
    expect(near.ok).toBe(true);
    expect(near.distanceKm).toBeLessThan(5);

    const far = checkDeliveryCoverage(restaurant(loc, 5), { lat: 19.6, lng: -99.1332 });
    expect(far.ok).toBe(false);
    expect(far.zoneKm).toBe(5);
  });
});
