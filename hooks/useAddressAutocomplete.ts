import { useCallback, useEffect, useMemo, useState } from 'react';
import debounce from 'lodash.debounce';
import { fetchPlaceSuggestions, PlaceSuggestion } from '@/services/places';

export function useAddressAutocomplete() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlaceSuggestion | null>(null);

  const runFetch = useCallback(async (q: string) => {
    setError(null);
    setSelected(null);
    if (!q) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchPlaceSuggestions(q);
      setSuggestions(res);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const debounced = useMemo(() => debounce(runFetch, 300), [runFetch]);

  useEffect(() => {
    debounced(query);
    return () => debounced.cancel();
  }, [query, debounced]);

  const select = (s: PlaceSuggestion) => {
    setSelected(s);
    setQuery(s.place_name);
    setSuggestions([]);
  };

  return { query, setQuery, loading, suggestions, error, selected, select } as const;
}
