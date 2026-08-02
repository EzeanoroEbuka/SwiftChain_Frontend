'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { reputationService } from '@/services/reputationService';

export interface UseDriverReputationResult {
  onChainScore: number | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * useDriverReputation — fetches a driver's on-chain reputation token score.
 *
 * Components consume this hook; they never call reputationService directly.
 * Aborts in-flight requests on unmount or driverId change to avoid setting
 * state on an unmounted component.
 */
export function useDriverReputation(driverId: string): UseDriverReputationResult {
  const [onChainScore, setOnChainScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!driverId) {
      setOnChainScore(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setIsLoading(true);

    reputationService
      .getDriverReputation(driverId, controller.signal)
      .then((data) => {
        if (cancelled) return;
        setOnChainScore(data.onChainScore);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (axios.isCancel(err)) return;
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Failed to load on-chain reputation';
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [driverId]);

  return { onChainScore, isLoading, error };
}
