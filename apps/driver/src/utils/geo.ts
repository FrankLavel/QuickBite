/**
 * utils/geo.ts
 * Utilidades de geolocalización: distancia Haversine y enlaces a mapas.
 */
import { Platform } from 'react-native';

export interface Coords {
  lat: number;
  lng: number;
}

/** Distancia en kilómetros entre dos coordenadas (fórmula de Haversine). */
export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** "1.2 km" o "850 m" según la magnitud. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * URL de indicaciones. Prefiere coordenadas; si no, usa el texto de la dirección.
 * En nativo abre la app de mapas; en web, Google Maps.
 */
export function directionsUrl(dest: Coords | string): string {
  if (typeof dest === 'string') {
    const q = encodeURIComponent(dest);
    return Platform.select({
      ios: `http://maps.apple.com/?daddr=${q}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    })!;
  }
  const q = `${dest.lat},${dest.lng}`;
  return Platform.select({
    ios: `http://maps.apple.com/?daddr=${q}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
  })!;
}
