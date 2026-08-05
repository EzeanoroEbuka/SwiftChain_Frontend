/**
 * useTrackingRoute Hook
 * React Query hook for managing delivery route tracking data
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getDeliveryRoute, getCurrentLocation } from '@/services/trackingService';
import { RouteData, Coordinate } from '@/types/tracking';

interface UseTrackingRouteReturn {
  routeData: RouteData | null;
  currentLocation: Coordinate | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<any>;
}

/**
 * Hook to fetch and manage delivery route tracking data
 * @param deliveryId - The delivery ID to track
 * @param enabled - Whether to enable the query (default: true)
 * @param refetchInterval - Refetch interval in milliseconds (default: 5000ms for live updates)
 * @returns Object with route data, current location, and loading states
 */
export function useTrackingRoute(
  deliveryId: string | null,
  enabled: boolean = true,
  refetchInterval: number = 5000
): UseTrackingRouteReturn {
  const routeQuery: UseQueryResult<RouteData, Error> = useQuery({
    queryKey: ['delivery-route', deliveryId],
    queryFn: () => {
      if (!deliveryId) throw new Error('Delivery ID is required');
      return getDeliveryRoute(deliveryId);
    },
    enabled: !!deliveryId && enabled,
    staleTime: 10000, // Consider data fresh for 10 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: 2, // Retry failed requests 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    refetchInterval: refetchInterval, // Refetch at specified interval for live tracking
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: true, // Refetch when connection is restored
  });

  // Separate query for current location (updates more frequently)
  const locationQuery: UseQueryResult<Coordinate, Error> = useQuery({
    queryKey: ['delivery-location', deliveryId],
    queryFn: () => {
      if (!deliveryId) throw new Error('Delivery ID is required');
      return getCurrentLocation(deliveryId);
    },
    enabled: !!deliveryId && enabled && routeQuery.data?.status === 'in_transit',
    staleTime: 5000, // Fresher data for current location
    gcTime: 60000, // Keep for 1 minute
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchInterval: 3000, // Update location more frequently (every 3 seconds)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const routeError = routeQuery.error instanceof Error ? routeQuery.error.message : null;
  const locationError = locationQuery.error instanceof Error ? locationQuery.error.message : null;
  const combinedError = routeError || locationError;

  return {
    routeData: routeQuery.data || null,
    currentLocation: locationQuery.data || null,
    isLoading: routeQuery.isLoading || locationQuery.isLoading,
    isError: routeQuery.isError || locationQuery.isError || Boolean(combinedError),
    error: combinedError,
    refetch: async () => {
      await routeQuery.refetch();
      if (locationQuery.isEnabled) {
        await locationQuery.refetch();
      }
    },
  };
}
