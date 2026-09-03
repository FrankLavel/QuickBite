/**
 * geo.ts
 * Cálculo de distancia y verificación de la zona de reparto.
 *
 * El restaurante define en el Dashboard su ubicación fija (`location`, GeoPoint)
 * y su radio de cobertura en km (`deliveryZone`). Aquí se calcula la distancia
 * en línea recta (Haversine) entre esa ubicación y la dirección de entrega del
 * cliente para decidir si el pedido cae dentro del rango.
 */

import type { Restaurant } from '@/types/restaurant.types';

export interface LatLng {
  lat: number;
  lng: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Distancia en km entre dos coordenadas (fórmula de Haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371; // radio medio de la Tierra en km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** ¿La coordenada tiene datos reales? (no vacía ni el (0,0) por defecto). */
export function hasValidCoords(c?: LatLng | null): c is LatLng {
  return (
    !!c &&
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng) &&
    !(c.lat === 0 && c.lng === 0)
  );
}

export interface CoverageResult {
  /** true = se puede entregar (o no hay datos para verificar → no se bloquea). */
  ok: boolean;
  /** Distancia calculada en km (solo si se pudo calcular). */
  distanceKm?: number;
  /** Radio de cobertura del restaurante en km (solo si se pudo verificar). */
  zoneKm?: number;
}

/**
 * Verifica si una dirección cae dentro de la zona de reparto del restaurante.
 *
 * Falla EN ABIERTO (`ok: true`) cuando faltan datos para verificar —el
 * restaurante no configuró su ubicación/zona, o la dirección no tiene
 * coordenadas reales— para no bloquear pedidos por información incompleta.
 */
export function checkDeliveryCoverage(
  restaurant: Restaurant,
  address?: LatLng | null
): CoverageResult {
  const loc = restaurant.location;
  const zoneKm = restaurant.deliveryZone;

  const restaurantHasLocation =
    !!loc &&
    typeof loc.latitude === 'number' &&
    typeof loc.longitude === 'number' &&
    !(loc.latitude === 0 && loc.longitude === 0);

  if (!restaurantHasLocation || !zoneKm || zoneKm <= 0) return { ok: true };
  if (!hasValidCoords(address)) return { ok: true };

  const d = distanceKm({ lat: loc.latitude, lng: loc.longitude }, address);
  return { ok: d <= zoneKm, distanceKm: d, zoneKm };
}
