import { renderHook, waitFor } from '@testing-library/react';
import { useXLMPriceChart } from '@/hooks/useXLMPriceChart';
import { priceService } from '@/services/priceService';

jest.mock('@/services/priceService');

describe('useXLMPriceChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch price data on mount', async () => {
    const mockResponse = {
      success: true,
      data: {
        currentPrice: 0.15,
        percentChange: 2.5,
        priceHistory: [
          { timestamp: '2026-06-01', price: 0.14 },
          { timestamp: '2026-06-02', price: 0.15 },
        ],
      },
    };

    (priceService.getXLMPriceTrend as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useXLMPriceChart());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentPrice).toBe(0.15);
    expect(result.current.percentChange).toBe(2.5);
    expect(result.current.priceHistory).toHaveLength(2);
  });

  it('should handle API errors gracefully', async () => {
    (priceService.getXLMPriceTrend as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Failed to fetch price data',
    });

    const { result } = renderHook(() => useXLMPriceChart());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch price data');
    expect(result.current.currentPrice).toBeNull();
  });

  it('should switch between 7-day and 30-day views', async () => {
    const mock7Day = {
      success: true,
      data: {
        currentPrice: 0.15,
        percentChange: 2.5,
        priceHistory: Array(7).fill({ timestamp: '2026-06-01', price: 0.15 }),
      },
    };

    const mock30Day = {
      success: true,
      data: {
        currentPrice: 0.15,
        percentChange: 5.0,
        priceHistory: Array(30).fill({ timestamp: '2026-06-01', price: 0.15 }),
      },
    };

    (priceService.getXLMPriceTrend as jest.Mock)
      .mockResolvedValueOnce(mock7Day)
      .mockResolvedValueOnce(mock30Day);

    const { result } = renderHook(() => useXLMPriceChart());

    await waitFor(() => {
      expect(result.current.periodDays).toBe(7);
    });

    // Switch to 30-day
    result.current.setPeriodDays(30);

    await waitFor(() => {
      expect(result.current.periodDays).toBe(30);
    });

    expect(priceService.getXLMPriceTrend).toHaveBeenCalledWith(30);
  });

  it('should refresh data when refresh is called', async () => {
    const mockResponse = {
      success: true,
      data: {
        currentPrice: 0.15,
        percentChange: 2.5,
        priceHistory: [{ timestamp: '2026-06-01', price: 0.15 }],
      },
    };

    (priceService.getXLMPriceTrend as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useXLMPriceChart());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.refresh();

    await waitFor(() => {
      expect(priceService.getXLMPriceTrend).toHaveBeenCalledTimes(2);
    });
  });
});
