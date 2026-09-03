/**
 * Tests de utils/geo.ts — distancia Haversine, formato y enlaces a mapas.
 */
import { haversineKm, formatDistance, directionsUrl } from '../geo';

describe('haversineKm', () => {
  it('es 0 para el mismo punto', () => {
    expect(haversineKm({ lat: 19.4, lng: -99.1 }, { lat: 19.4, lng: -99.1 })).toBe(0);
  });
  it('~111 km por un grado de longitud en el ecuador', () => {
    const d = haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });
});

describe('formatDistance', () => {
  it('usa metros bajo 1 km y km por encima', () => {
    expect(formatDistance(0.85)).toBe('850 m');
    expect(formatDistance(0.5)).toBe('500 m');
    expect(formatDistance(1.2)).toBe('1.2 km');
  });
});

describe('directionsUrl', () => {
  it('incluye las coordenadas del destino', () => {
    expect(directionsUrl({ lat: 19.4, lng: -99.1 })).toContain('19.4,-99.1');
  });
  it('codifica una dirección de texto', () => {
    const url = directionsUrl('Calle 1, CDMX');
    expect(url).toContain('Calle');
    expect(url.toLowerCase()).toContain('maps');
  });
});
