/**
 * geocode.ts
 * Resolución de direcciones (texto ⇄ coordenadas).
 *
 * Cascada de precisión:
 *   1. Google Geocoding API — máxima precisión (requiere EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
 *      con la "Geocoding API" habilitada + billing en Google Cloud).
 *   2. Nominatim (OpenStreetMap) — gratis, sin key.
 *   3. Geocoder nativo de expo-location — offline / último recurso.
 *
 * Cada nivel cae al siguiente si no hay key, no hay red, o no devuelve datos
 * útiles. Así nunca queda peor que antes aunque falte configuración.
 */

import * as Location from 'expo-location';
import { config } from '@/constants/config';

export interface ResolvedAddress {
  street: string;
  city: string;
}

const GOOGLE = 'https://maps.googleapis.com/maps/api/geocode/json';
const NOMINATIM = 'https://nominatim.openstreetmap.org';
// Nominatim pide identificar la app en el User-Agent (su política de uso).
const NOMINATIM_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'QuickBite/1.0 (proyecto escolar)',
};

// Valores basura que a veces devuelve el geocoder nativo para calles sin nombre.
const JUNK = new Set(['ninguno', 'sin nombre', 'unnamed road', 'camino sin nombre']);
const clean = (v?: string | null): string => {
  const s = (v ?? '').trim();
  return JUNK.has(s.toLowerCase()) ? '' : s;
};

/** Une "calle número" descartando piezas vacías/basura. */
const joinStreet = (road?: string | null, number?: string | null) =>
  [clean(road), (number ?? '').trim()].filter(Boolean).join(' ').trim();

// ---------------------------------------------------------------------------
// Google Geocoding API
// ---------------------------------------------------------------------------

interface GoogleComponent {
  long_name: string;
  short_name: string;
  types: string[];
}
interface GoogleResult {
  address_components?: GoogleComponent[];
  geometry?: { location?: { lat: number; lng: number } };
}
interface GoogleResponse {
  status: string;
  results?: GoogleResult[];
}

/** Extrae { street, city } de los address_components de Google. */
function parseGoogle(result: GoogleResult): ResolvedAddress {
  const comps = result.address_components ?? [];
  const get = (type: string) =>
    comps.find((c) => c.types.includes(type))?.long_name ?? '';
  const street = joinStreet(get('route'), get('street_number'));
  const city =
    get('locality') ||
    get('sublocality') ||
    get('administrative_area_level_2') ||
    get('administrative_area_level_1') ||
    '';
  return { street, city };
}

async function googleReverse(lat: number, lng: number): Promise<ResolvedAddress | null> {
  const key = config.maps.apiKey;
  if (!key) return null;
  const url = `${GOOGLE}?latlng=${lat},${lng}&language=es&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as GoogleResponse;
  if (data.status !== 'OK' || !data.results?.length) return null;
  const parsed = parseGoogle(data.results[0]);
  return parsed.street || parsed.city ? parsed : null;
}

async function googleForward(query: string): Promise<{ lat: number; lng: number } | null> {
  const key = config.maps.apiKey;
  if (!key) return null;
  const url = `${GOOGLE}?address=${encodeURIComponent(query)}&language=es&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as GoogleResponse;
  const loc = data.status === 'OK' ? data.results?.[0]?.geometry?.location : undefined;
  return loc ? { lat: loc.lat, lng: loc.lng } : null;
}

// ---------------------------------------------------------------------------
// Nominatim (OpenStreetMap)
// ---------------------------------------------------------------------------

async function nominatimReverse(lat: number, lng: number): Promise<ResolvedAddress | null> {
  const url =
    `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&accept-language=es` +
    `&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) return null;
  const a = (await res.json())?.address as Record<string, string> | undefined;
  if (!a) return null;
  const street = joinStreet(a.road ?? a.pedestrian ?? a.footway, a.house_number);
  const city =
    clean(a.city) ||
    clean(a.town) ||
    clean(a.village) ||
    clean(a.municipality) ||
    clean(a.county) ||
    clean(a.state) ||
    '';
  return street || city ? { street, city } : null;
}

async function nominatimForward(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${NOMINATIM}/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!Array.isArray(data) || !data[0]) return null;
  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  return Number.isNaN(lat) || Number.isNaN(lng) ? null : { lat, lng };
}

// ---------------------------------------------------------------------------
// Geocoder nativo (expo-location) — fallback offline
// ---------------------------------------------------------------------------

async function nativeReverse(lat: number, lng: number): Promise<ResolvedAddress | null> {
  const [g] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
  if (!g) return null;
  const street = joinStreet(g.street ?? g.name, g.streetNumber);
  const city =
    clean(g.city) || clean(g.district) || clean(g.subregion) || clean(g.region) || '';
  return street || city ? { street, city } : null;
}

async function nativeForward(query: string): Promise<{ lat: number; lng: number } | null> {
  const [geo] = await Location.geocodeAsync(query);
  return geo ? { lat: geo.latitude, lng: geo.longitude } : null;
}

// ---------------------------------------------------------------------------
// API pública: intenta cada fuente en orden y devuelve la primera útil.
// ---------------------------------------------------------------------------

/** Corre proveedores en orden; el primero que devuelva algo (sin lanzar) gana. */
async function firstResolved<T>(
  providers: Array<() => Promise<T | null>>
): Promise<T | null> {
  for (const provider of providers) {
    try {
      const result = await provider();
      if (result) return result;
    } catch {
      // ignora el fallo y prueba el siguiente proveedor
    }
  }
  return null;
}

/** Coordenadas → { street, city }. Google → Nominatim → nativo. */
export function reverseGeocode(lat: number, lng: number): Promise<ResolvedAddress | null> {
  return firstResolved<ResolvedAddress>([
    () => googleReverse(lat, lng),
    () => nominatimReverse(lat, lng),
    () => nativeReverse(lat, lng),
  ]);
}

/** Texto → coordenadas. Google → Nominatim → nativo. */
export function forwardGeocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim();
  if (!q) return Promise.resolve(null);
  return firstResolved<{ lat: number; lng: number }>([
    () => googleForward(q),
    () => nominatimForward(q),
    () => nativeForward(q),
  ]);
}
