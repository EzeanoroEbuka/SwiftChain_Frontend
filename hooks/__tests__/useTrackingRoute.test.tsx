/**
 * useTrackingRoute Hook Tests
 * Unit tests for route tracking state management
 */

import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTrackingRoute } from '@/hooks/useTrackingRoute';
import * as trackingService from '@/services/trackingService';
import { RouteData } from '@/types/tracking';

jest.mock('@/services/trackingService');
const mockTrackingService = trackingService as jest.Mocked<typeof trackingService>;

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Disable garbage collection for tests
      },
    },
  });

// Wrapper component for tests
const createWrapper = () => {
  const testQueryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('useTrackingRoute', () => {
  const mockDeliveryId = 'delivery-123';

  const mockRouteData: RouteData = {
    deliveryId: mockDeliveryId,
    origin: { latitude: 6.5244, longitude: 3.3792 },
    destination: { latitude: 6.6263, longitude: 3.2863 },
    waypoints: [
      {
        coordinate: { latitude: 6.5244, longitude: 3.3792 },
        label: 'Pickup',
        type: 'origin',
      },
      {
        coordinate: { latitude: 6.6263, longitude: 3.2863 },
        label: 'Delivery',
        type: 'destination',
      },
    ],
    distance: 12.5,
    estimatedTime: 25,
    currentLocation: { latitude: 6.5500, longitude: 3.3500 },
    status: 'in_transit',
    timestamp: '2026-05-29T10:30:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackingService.getDeliveryRoute.mockReset();
    mockTrackingService.getCurrentLocation.mockReset();
    mockTrackingService.getCurrentLocation.mockResolvedValue({
      latitude: 0,
      longitude: 0,
    });
  });

  it('should initialize with null data', () => {
    mockTrackingService.getDeliveryRoute.mockResolvedValueOnce(mockRouteData);

    const { result } = renderHook(() => useTrackingRoute(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.routeData).toBeNull();
    expect(result.current.currentLocation).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch route data when delivery ID is provided', async () => {
    mockTrackingService.getDeliveryRoute.mockResolvedValueOnce(mockRouteData);
    mockTrackingService.getCurrentLocation.mockResolvedValueOnce({
      latitude: 6.5500,
      longitude: 3.3500,
    });

    const { result } = renderHook(() => useTrackingRoute(mockDeliveryId), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.routeData).toEqual(mockRouteData);
  });

  it('should call getDeliveryRoute with correct delivery ID', async () => {
    mockTrackingService.getDeliveryRoute.mockResolvedValueOnce(mockRouteData);

    renderHook(() => useTrackingRoute(mockDeliveryId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockTrackingService.getDeliveryRoute).toHaveBeenCalledWith(mockDeliveryId);
    });
  });

  it('should not fetch when delivery ID is null', () => {
    mockTrackingService.getDeliveryRoute.mockResolvedValueOnce(mockRouteData);

    renderHook(() => useTrackingRoute(null), {
      wrapper: createWrapper(),
    });

    expect(mockTrackingService.getDeliveryRoute).not.toHaveBeenCalled();
  });

  it('should handle error state', async () => {
    const mockError = new Error('Failed to fetch route');
    mockTrackingService.getDeliveryRoute.mockRejectedValue(mockError);

    const { result } = renderHook(() => useTrackingRoute(mockDeliveryId), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.error).toBe('Failed to fetch route');
      },
      { timeout: 30000 }
    );

    expect(result.current.routeData).toBeNull();
  }, 30000);

  it('should disable query when enabled is false', () => {
    mockTrackingService.getDeliveryRoute.mockResolvedValueOnce(mockRouteData);

    renderHook(() => useTrackingRoute(null), {
      wrapper: createWrapper(),
    });

    expect(mockTrackingService.getDeliveryRoute).not.toHaveBeenCalled();
  });
});
