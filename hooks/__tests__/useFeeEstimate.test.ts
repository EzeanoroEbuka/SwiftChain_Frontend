import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFeeEstimate } from '@/hooks/useFeeEstimate';
import { feeService } from '@/services/feeService';
import { FeeEstimate } from '@/types/fee';

// Mock the feeService
jest.mock('@/services/feeService');

const mockFeeService = feeService as jest.Mocked<typeof feeService>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

const createWrapperWithRetry = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        gcTime: 0,
      },
    },
  });
  return function WrapperWithRetry({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

const MOCK_FEE: FeeEstimate = {
  estimatedXLMCost: 0.5,
  baseFee: 0.0001,
  networkFee: 0.1,
  platformFee: 0.3889,
  totalAmount: 100.5,
  currency: 'USD',
  timestamp: new Date().toISOString(),
};

describe('useFeeEstimate Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should handle null amount gracefully', async () => {
      const { result } = renderHook(() => useFeeEstimate(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.estimatedFee).toBeUndefined();
      expect(result.current.estimatedXLMCost).toBe(0);
      expect(result.current.error).toBeNull();
    });

    it('should handle zero amount', async () => {
      const { result } = renderHook(() => useFeeEstimate(0), {
        wrapper: createWrapper(),
      });

      expect(result.current.estimatedFee).toBeUndefined();
    });

    it('should handle negative amount', async () => {
      const { result } = renderHook(() => useFeeEstimate(-50), {
        wrapper: createWrapper(),
      });

      expect(result.current.estimatedFee).toBeUndefined();
    });

    it('should initialize with loading state for valid amount', async () => {
      mockFeeService.getEstimatedFee.mockResolvedValue(MOCK_FEE);

      const { result } = renderHook(() => useFeeEstimate(100), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch fee estimate from service', async () => {
      mockFeeService.getEstimatedFee.mockResolvedValue(MOCK_FEE);

      const { result } = renderHook(() => useFeeEstimate(100, 'USD'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.estimatedXLMCost).toBe(0.5);
      expect(mockFeeService.getEstimatedFee).toHaveBeenCalledWith(100, 'USD');
    });

    it('should default to USD currency', async () => {
      mockFeeService.getEstimatedFee.mockResolvedValue(MOCK_FEE);

      const { result } = renderHook(() => useFeeEstimate(100), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFeeService.getEstimatedFee).toHaveBeenCalledWith(100, 'USD');
    });

    it('should handle invalid amounts with disabled query', () => {
      const { result } = renderHook(() => useFeeEstimate(0), {
        wrapper: createWrapper(),
      });

      // Query is disabled for invalid amounts, so no loading/error states
      expect(result.current.estimatedFee).toBeUndefined();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Fee Breakdown', () => {
    it('should return fee estimate with all components', async () => {
      mockFeeService.getEstimatedFee.mockResolvedValue(MOCK_FEE);

      const { result } = renderHook(() => useFeeEstimate(100), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.estimatedFee).toBeDefined();
      });

      expect(result.current.baseFee).toBe(0.0001);
      expect(result.current.networkFee).toBe(0.1);
      expect(result.current.platformFee).toBe(0.3889);
    });

    it('should calculate correct total amount', async () => {
      mockFeeService.getEstimatedFee.mockResolvedValue(MOCK_FEE);

      const { result } = renderHook(() => useFeeEstimate(100), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.estimatedFee).toBeDefined();
      });

      expect(result.current.totalAmount).toBe(100.5);
    });

    it('should return estimated XLM cost', async () => {
      mockFeeService.getEstimatedFee.mockResolvedValue(MOCK_FEE);

      const { result } = renderHook(() => useFeeEstimate(100), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.estimatedFee).toBeDefined();
      });

      expect(result.current.estimatedXLMCost).toBe(0.5);
    });

    it('should handle different currencies', async () => {
      const eurFee: FeeEstimate = {
        ...MOCK_FEE,
        currency: 'EUR',
      };

      mockFeeService.getEstimatedFee.mockResolvedValue(eurFee);

      const { result } = renderHook(() => useFeeEstimate(100, 'EUR'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.estimatedFee).toBeDefined();
      });

      expect(result.current.estimatedFee?.currency).toBe('EUR');
      expect(mockFeeService.getEstimatedFee).toHaveBeenCalledWith(100, 'EUR');
    });
  });

  describe('Amount Updates', () => {
    it('should update fees when amount changes', async () => {
      const smallFee: FeeEstimate = {
        ...MOCK_FEE,
        totalAmount: 50.25,
        estimatedXLMCost: 0.25,
      };

      mockFeeService.getEstimatedFee.mockResolvedValue(smallFee);

      const { result, rerender } = renderHook(
        ({ amount }) => useFeeEstimate(amount),
        {
          wrapper: createWrapper(),
          initialProps: { amount: 50 },
        }
      );

      await waitFor(() => {
        expect(result.current.estimatedXLMCost).toBe(0.25);
      });

      // Change amount
      const largeFee: FeeEstimate = {
        ...MOCK_FEE,
        totalAmount: 100.5,
        estimatedXLMCost: 0.5,
      };

      mockFeeService.getEstimatedFee.mockResolvedValue(largeFee);

      rerender({ amount: 100 });

      await waitFor(() => {
        expect(result.current.estimatedXLMCost).toBe(0.5);
      });
    });

    it('should cache fee estimates', async () => {
      mockFeeService.getEstimatedFee.mockResolvedValue(MOCK_FEE);

      const { result } = renderHook(() => useFeeEstimate(100, 'USD'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.estimatedFee).toBeDefined();
      });

      expect(mockFeeService.getEstimatedFee).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('should indicate loading during fetch', async () => {
      mockFeeService.getEstimatedFee.mockResolvedValue(MOCK_FEE);

      const { result } = renderHook(() => useFeeEstimate(100), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should track fetching state', async () => {
      mockFeeService.getEstimatedFee.mockResolvedValue(MOCK_FEE);

      const { result } = renderHook(() => useFeeEstimate(100), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should not throw on disabled query', () => {
      const { result } = renderHook(() => useFeeEstimate(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBeNull();
    });

    it('should default error to null on success', async () => {
      mockFeeService.getEstimatedFee.mockResolvedValue(MOCK_FEE);

      const { result } = renderHook(() => useFeeEstimate(100), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small amounts', async () => {
      const smallFee: FeeEstimate = {
        ...MOCK_FEE,
        estimatedXLMCost: 0.01,
        totalAmount: 0.51,
      };

      mockFeeService.getEstimatedFee.mockResolvedValue(smallFee);

      const { result } = renderHook(() => useFeeEstimate(0.5), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.estimatedFee).toBeDefined();
      });

      expect(result.current.estimatedXLMCost).toBe(0.01);
    });

    it('should handle very large amounts', async () => {
      const largeFee: FeeEstimate = {
        ...MOCK_FEE,
        estimatedXLMCost: 500,
        totalAmount: 100500,
      };

      mockFeeService.getEstimatedFee.mockResolvedValue(largeFee);

      const { result } = renderHook(() => useFeeEstimate(100000), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.estimatedFee).toBeDefined();
      });

      expect(result.current.estimatedXLMCost).toBe(500);
    });

    it('should handle decimal amounts', async () => {
      mockFeeService.getEstimatedFee.mockResolvedValue(MOCK_FEE);

      const { result } = renderHook(() => useFeeEstimate(99.99), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.estimatedFee).toBeDefined();
      });

      expect(mockFeeService.getEstimatedFee).toHaveBeenCalledWith(99.99, 'USD');
    });
  });
});
