'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DeliveryFilterParams, DeliveryStatus } from '@/types/filters';

/**
 * Hook for managing delivery filter state via URL query parameters
 * Provides type-safe filter management with persistence across page reloads
 */
export function useDeliveryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract filter state from URL
  const filters = useMemo(
    () => ({
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as DeliveryStatus) || undefined,
      sortBy: (searchParams.get('sortBy') as 'date-asc' | 'date-desc') || undefined,
    }),
    [searchParams]
  );

  const hasActiveFilters = useMemo(
    () => !!(filters.search || filters.status || filters.sortBy),
    [filters]
  );

  /**
   * Update one or more filters and persist to URL
   */
  const updateFilters = useCallback(
    (newFilters: Partial<DeliveryFilterParams>) => {
      const params = new URLSearchParams(searchParams);

      if (newFilters.search !== undefined) {
        if (newFilters.search) {
          params.set('search', newFilters.search);
        } else {
          params.delete('search');
        }
      }

      if (newFilters.status !== undefined) {
        if (newFilters.status) {
          params.set('status', newFilters.status);
        } else {
          params.delete('status');
        }
      }

      if (newFilters.sortBy !== undefined) {
        if (newFilters.sortBy) {
          params.set('sortBy', newFilters.sortBy);
        } else {
          params.delete('sortBy');
        }
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    router.push('?', { scroll: false });
  }, [router]);

  return {
    ...filters,
    hasActiveFilters,
    updateFilters,
    clearFilters,
  };
}
