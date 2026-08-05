export type PlaceSuggestion = {
  id: string;
  place_name: string;
  latitude: number;
  longitude: number;
  city?: string | null;
  postcode?: string | null;
};

export async function fetchPlaceSuggestions(q: string): Promise<PlaceSuggestion[]> {
  if (!q) return [];
  const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to fetch place suggestions');
  }
  const json = await res.json();
  return json.suggestions || [];
}
