import { useCallback, useEffect, useMemo, useState } from 'react';
import debounce from 'lodash.debounce';
import { resolveFederationAddress, FederationResult } from '@/services/federation';

export function useFederationResolver() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FederationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runResolve = useCallback(async (addr: string) => {
    setError(null);
    setResult(null);
    if (!addr || !addr.includes('*')) return;
    setLoading(true);
    try {
      const res = await resolveFederationAddress(addr);
      setResult(res as FederationResult);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const debounced = useMemo(() => debounce(runResolve, 500), [runResolve]);

  useEffect(() => {
    if (value && value.includes('*')) {
      debounced(value);
    } else {
      debounced.cancel();
      // Schedule resets as a microtask to avoid synchronous setState in effect
      Promise.resolve().then(() => {
        setResult(null);
        setError(null);
        setLoading(false);
      });
    }
    return () => debounced.cancel();
  }, [value, debounced]);

  return { value, setValue, loading, result, error } as const;
}
