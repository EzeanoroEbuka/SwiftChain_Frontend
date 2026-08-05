/**
 * useCurrencyConversion — Hook layer for XLM → NGN conversion.
 *
 * Accepts an XLM amount string (directly from a controlled input) and
 * returns the formatted NGN equivalent, loading state, and error state.
 *
 * Architecture: Component → useCurrencyConversion (Hook) → fxService → Backend
 */

'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fxService, formatNgn } from '@/services/fxService';

// Re-fetch the rate every 60 seconds — matches the service cache TTL
const REFETCH_INTERVAL_MS = 60_000;

export interface CurrencyConversionResult {
  /** Formatted NGN string, e.g. "₦1,234,567.89". Empty string when unavailable. */
  ngnAmount: string;
  /** Raw NGN number for programmatic use. null when unavailable. */
  ngnRaw: number | null;
  /** XLM/NGN rate currently in use. null when unavailable. */
  rate: number | null;
  /** ISO 8601 timestamp of the rate. null when unavailable. */
  rateUpdatedAt: string | null;
  isLoading: boolean;
  isError: boolean;
}

/**
 * @param xlmAmount - The XLM amount as a string (e.g. from a text input).
 *                    Handles empty strings, "0", non-numeric, and negative values gracefully.
 */
export function useCurrencyConversion(xlmAmount: string): CurrencyConversionResult {
  // Parse the raw string into a safe number once
  const parsedXlm = useMemo(() => {
    const n = parseFloat(xlmAmount);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [xlmAmount]);

  // Fetch (and cache) the NGN/XLM rate
  const rateQuery = useQuery({
    queryKey: ['fx-rate', 'NGN'],
    queryFn: () => fxService.getNgnXlmRate(),
    refetchInterval: REFETCH_INTERVAL_MS,
    retry: false,
    staleTime: REFETCH_INTERVAL_MS,
  });

  // Compute the NGN value whenever the rate or input changes
  const ngnRaw = useMemo<number | null>(() => {
    const rate = rateQuery.data?.ngnPerXlm;
    if (typeof rate !== 'number' || rate <= 0) return null;
    if (parsedXlm === 0) return 0;
    return parsedXlm * rate;
  }, [parsedXlm, rateQuery.data?.ngnPerXlm]);

  const ngnAmount = useMemo<string>(() => {
    if (ngnRaw === null) return '';
    return formatNgn(ngnRaw);
  }, [ngnRaw]);

  return {
    ngnAmount,
    ngnRaw,
    rate: rateQuery.data?.ngnPerXlm ?? null,
    rateUpdatedAt: rateQuery.data?.updatedAt ?? null,
    isLoading: rateQuery.isLoading,
    isError: rateQuery.isError,
  };
}
