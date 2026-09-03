/**
 * services/geocode.ts
 * Geocodificación de direcciones → coordenadas usando Nominatim (OpenStreetMap),
 * gratis y sin API key. Se usa para autocompletar la ubicación del local en
 * Configuración a partir de la dirección escrita.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Convierte una dirección de texto en coordenadas. Devuelve null si no hay
 * ninguna coincidencia. Lanza si el servicio no responde.
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  const query = address.trim();
  if (!query) return null;

  const url =
    'https://nominatim.openstreetmap.org/search?format=json&limit=1' +
    `&addressdetails=0&q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error('No se pudo consultar el servicio de ubicación.');
  }

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  if (!Array.isArray(data) || data.length === 0) return null;

  const first = data[0];
  const lat = parseFloat(first.lat);
  const lng = parseFloat(first.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return { lat, lng, displayName: first.display_name };
}
