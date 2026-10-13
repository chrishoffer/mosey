/**
 * Live place search for the "Where" field — real locations from the Open-Meteo
 * geocoding API (GeoNames data): free, keyless, no secret to protect, and a REAL
 * data source per CLAUDE.md hard line #2 (we never invent places; we look them
 * up). Returns [] on any failure so typing free-form always still works.
 */
export interface PlaceSuggestion {
  id: string;
  /** "Gatlinburg, Tennessee, United States" */
  label: string;
  name: string;
  lat: number;
  lng: number;
}

interface GeoResult {
  id?: number;
  name?: string;
  admin1?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const json = (await res.json()) as { results?: GeoResult[] };
    return (json.results ?? [])
      .filter((r) => r.name && typeof r.latitude === 'number' && typeof r.longitude === 'number')
      .map((r, i) => ({
        id: String(r.id ?? `${r.name}-${i}`),
        label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
        name: r.name as string,
        lat: r.latitude as number,
        lng: r.longitude as number,
      }));
  } catch {
    return [];
  }
}
