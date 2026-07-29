import axios from 'axios';
import type { PricingComparison } from '@/types/pricing';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * pricingService — all pricing-related API communication.
 * Hooks call this; components never call this directly.
 */
export const pricingService = {
  async getComparison(signal?: AbortSignal): Promise<PricingComparison> {
    const { data } = await axios.get<PricingComparison>(
      `${API_BASE_URL}/pricing/comparison`,
      { signal },
    );
    return data;
  },
};
