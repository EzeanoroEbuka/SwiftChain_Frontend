'use client';

import { useState, useEffect, useCallback } from 'react';
import { priceService, type PriceDataPoint } from '@/services/priceService';

export interface UseXLMPriceChartResult {
  /** Current XLM price */
  currentPrice: number | null;
  /** Percentage change over the selected period */
  percentChange: number | null;
  /** Array of price data points for chart rendering */
  priceHistory: PriceDataPoint[];
  /** True while fetching data */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refresh the chart data */
  refresh: () => Promise<void>;
  /** Switch between 7-day and 30-day view */
  setPeriodDays: (days: 7 | 30) => Promise<void>;
  /** Current selected period */
  periodDays: 7 | 30;
}

/**
 * useXLMPriceChart — fetches and manages XLM price trend data.
 *
 * Follows the Component → Hook → Service pattern:
 *   XLMPriceChart (component) → useXLMPriceChart (hook) → priceService (service)
 */
export function useXLMPriceChart(): UseXLMPriceChartResult {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [percentChange, setPercentChange] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState<7 | 30>(7);

  const fetchPriceData = useCallback(async (days: 7 | 30) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await priceService.getXLMPriceTrend(days);

      if (response.success && response.data) {
        setCurrentPrice(response.data.currentPrice);
        setPercentChange(response.data.percentChange);
        setPriceHistory(response.data.priceHistory);
      } else {
        setError(response.message ?? 'Failed to fetch price data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await priceService.getXLMPriceTrend(periodDays);
        if (cancelled) return;
        if (response.success && response.data) {
          setCurrentPrice(response.data.currentPrice);
          setPercentChange(response.data.percentChange);
          setPriceHistory(response.data.priceHistory);
        } else {
          setError(response.message ?? 'Failed to fetch price data');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [periodDays]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await priceService.getXLMPriceTrend(periodDays);
      if (response.success && response.data) {
        setCurrentPrice(response.data.currentPrice);
        setPercentChange(response.data.percentChange);
        setPriceHistory(response.data.priceHistory);
      } else {
        setError(response.message ?? 'Failed to fetch price data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [periodDays]);

  const handleSetPeriodDays = useCallback(async (days: 7 | 30) => {
    setPeriodDays(days);
  }, []);

  return {
    currentPrice,
    percentChange,
    priceHistory,
    isLoading,
    error,
    refresh,
    setPeriodDays: handleSetPeriodDays,
    periodDays,
  };
}
