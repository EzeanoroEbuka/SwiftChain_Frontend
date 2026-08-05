/**
 * fxService — Service layer for NGN/XLM foreign exchange rates.
 *
 * Responsibilities:
 * - Fetches the live NGN↔XLM rate from the backend API via currencyRateService.
 * - Applies an in-memory TTL cache so rapid keystrokes don't flood the API.
 * - Exposes a pure formatting helper so the hook/component layer never
 *   needs to instantiate Intl.NumberFormat directly.
 *
 * Architecture: Component → Hook → fxService → currencyRateService → Backend
 */

import { currencyRateService } from '@/services/currencyRateService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NgnXlmRate {
  /** How many NGN one XLM is worth right now */
  ngnPerXlm: number;
  /** ISO 8601 timestamp from the backend */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory TTL cache
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 60_000; // 60 seconds — balance between freshness and API load

interface CacheEntry {
  data: NgnXlmRate;
  expiresAt: number;
}

let cache: CacheEntry | null = null;

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const ngnFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a number as a Nigerian Naira string.
 * e.g. 1234567.89 → "₦1,234,567.89"
 */
export function formatNgn(amount: number): string {
  return ngnFormatter.format(amount);
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const fxService = {
  /**
   * Returns the current NGN/XLM rate.
   * Hits the in-memory cache for up to `CACHE_TTL_MS` before re-fetching.
   */
  async getNgnXlmRate(): Promise<NgnXlmRate> {
    const now = Date.now();

    // Return cached entry if still valid
    if (cache && now < cache.expiresAt) {
      return cache.data;
    }

    // Fetch fresh rate from the backend (NGN fiat code)
    const response = await currencyRateService.getXlmRate('NGN');

    const entry: NgnXlmRate = {
      ngnPerXlm: response.xlmRate,
      updatedAt: response.updatedAt,
    };

    // Store in cache
    cache = { data: entry, expiresAt: now + CACHE_TTL_MS };

    return entry;
  },

  /**
   * Converts an XLM amount to its NGN equivalent.
   * Returns `null` if the rate is unavailable.
   */
  async convertXlmToNgn(xlmAmount: number): Promise<number | null> {
    if (!Number.isFinite(xlmAmount) || xlmAmount < 0) return null;
    if (xlmAmount === 0) return 0;

    const { ngnPerXlm } = await this.getNgnXlmRate();
    if (!ngnPerXlm || ngnPerXlm <= 0) return null;

    return xlmAmount * ngnPerXlm;
  },

  /**
   * Clears the in-memory cache — useful for testing or forced refresh.
   */
  clearCache(): void {
    cache = null;
  },
};
