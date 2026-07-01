/**
 * useFiatXlmSlippage — Hook layer for monitoring NGN/XLM FX rate slippage.
 *
 * Monitors the quoted rate and tracks volatility. Provides slippage state,
 * warning levels, and acknowledgment flags for the component.
 *
 * Architecture: Component → useFiatXlmSlippage (Hook) → fiatXlmSlippageService → Backend
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fxService } from '@/services/fxService';
import {
  fiatXlmSlippageService,
  SlippageResult,
} from '@/services/fiatXlmSlippageService';

// Re-fetch the rate every 60 seconds — matches the service cache TTL
const RATE_REFETCH_INTERVAL_MS = 60_000;

export interface UseFiatXlmSlippageResult {
  /** The rate initially quoted to the user */
  quotedRate: number | null;
  /** Current slippage calculation result */
  slippage: SlippageResult | null;
  /** Whether the rate has volatile movement (>2%) */
  isVolatile: boolean;
  /** Whether slippage is critical (>5%) and requires acknowledgment */
  requiresAcknowledgment: boolean;
  /** Whether the user has checked the acknowledgment box */
  isAcknowledged: boolean;
  /** Function to set acknowledgment state */
  setAcknowledged: (acknowledged: boolean) => void;
  /** Function to start tracking a new quote */
  startQuote: (initialRate: number) => void;
  /** Function to stop tracking */
  stopQuote: () => void;
  /** Loading state for rate fetching */
  isLoadingRate: boolean;
}

/**
 * Hook for monitoring FX rate slippage and volatility.
 *
 * Usage:
 * ```tsx
 * const slippage = useFiatXlmSlippage();
 * 
 * useEffect(() => {
 *   slippage.startQuote(currentRate);
 *   return () => slippage.stopQuote();
 * }, []);
 * 
 * if (slippage.requiresAcknowledgment) {
 *   // Show checkbox requiring acknowledgment
 * }
 * ```
 */
export function useFiatXlmSlippage(): UseFiatXlmSlippageResult {
  const [quotedRate, setQuotedRate] = useState<number | null>(null);
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  // Fetch the current FX rate, refetching every 60 seconds
  const rateQuery = useQuery({
    queryKey: ['fx-rate', 'NGN'],
    queryFn: () => fxService.getNgnXlmRate(),
    refetchInterval: RATE_REFETCH_INTERVAL_MS,
    retry: false,
    staleTime: RATE_REFETCH_INTERVAL_MS,
  });

  const currentRate = rateQuery.data?.ngnPerXlm ?? null;

  // Update slippage history whenever the rate changes
  useEffect(() => {
    if (currentRate !== null && quotedRate !== null) {
      fiatXlmSlippageService.recordRateUpdate(currentRate);
    }
  }, [currentRate, quotedRate]);

  // Calculate current slippage
  const slippage =
    currentRate !== null ? fiatXlmSlippageService.calculateSlippage(currentRate) : null;

  const handleStartQuote = useCallback((initialRate: number) => {
    setQuotedRate(initialRate);
    setIsAcknowledged(false);
    fiatXlmSlippageService.startTracking(initialRate);
  }, []);

  const handleStopQuote = useCallback(() => {
    setQuotedRate(null);
    setIsAcknowledged(false);
    fiatXlmSlippageService.stopTracking();
  }, []);

  return {
    quotedRate,
    slippage,
    isVolatile: slippage?.isVolatile ?? false,
    requiresAcknowledgment: slippage?.requiresAcknowledgment ?? false,
    isAcknowledged,
    setAcknowledged: setIsAcknowledged,
    startQuote: handleStartQuote,
    stopQuote: handleStopQuote,
    isLoadingRate: rateQuery.isLoading,
  };
}
