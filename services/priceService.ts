import api from '@/lib/api';

export interface PriceDataPoint {
  timestamp: string;
  price: number;
}

export interface PriceChartResponse {
  success: boolean;
  message?: string;
  data?: {
    currentPrice: number;
    percentChange: number;
    priceHistory: PriceDataPoint[];
  };
}

/**
 * priceService — handles all XLM price-related API communication.
 * Fetches real-time price data and historical trends from the backend.
 */
export const priceService = {
  /**
   * Fetches XLM price data with historical trend.
   * @param days - Number of days to retrieve (7 or 30)
   */
  async getXLMPriceTrend(days: 7 | 30 = 7): Promise<PriceChartResponse> {
    try {
      const { data } = await api.get<PriceChartResponse>(`/api/price/xlm-trend`, {
        params: { days },
      });
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch price data',
      };
    }
  },

  /**
   * Fetches current XLM to fiat conversion rate.
   * @param currency - Fiat currency code (e.g., 'USD', 'EUR')
   */
  async getCurrentXLMRate(currency: string = 'USD'): Promise<PriceChartResponse> {
    try {
      const { data } = await api.get<PriceChartResponse>(`/api/price/xlm-current`, {
        params: { currency },
      });
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch current price',
      };
    }
  },
};
