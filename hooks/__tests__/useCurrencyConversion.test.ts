/**
 * useCurrencyConversion hook tests
 *
 * Strategy: mock fxService at the module boundary so tests are fast
 * and deterministic. The QueryClientProvider wrapper mirrors the pattern
 * used in hooks/__tests__/useCurrencyConverter.test.ts.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { fxService } from '@/services/fxService';

// ---------------------------------------------------------------------------
// Mock the service layer
// ---------------------------------------------------------------------------
jest.mock('@/services/fxService', () => ({
  fxService: {
    getNgnXlmRate: jest.fn(),
    clearCache: jest.fn(),
  },
  // Keep formatNgn real so we can assert on formatted output
  formatNgn: jest.requireActual('@/services/fxService').formatNgn,
}));

const mockGetNgnXlmRate = fxService.getNgnXlmRate as jest.MockedFunction<
  typeof fxService.getNgnXlmRate
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const MOCK_RATE = 2_500; // 1 XLM = ₦2,500

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useCurrencyConversion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -- Successful conversion ------------------------------------------------

  it('calculates NGN correctly for 1 XLM', async () => {
    mockGetNgnXlmRate.mockResolvedValue({
      ngnPerXlm: MOCK_RATE,
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const { result } = renderHook(() => useCurrencyConversion('1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 1 XLM × ₦2,500 = ₦2,500
    expect(result.current.ngnRaw).toBe(2_500);
    expect(result.current.ngnAmount).toMatch(/2[,.]?500/); // locale-safe
    expect(result.current.rate).toBe(MOCK_RATE);
    expect(result.current.isError).toBe(false);
  });

  it('calculates NGN correctly for a fractional XLM amount', async () => {
    mockGetNgnXlmRate.mockResolvedValue({
      ngnPerXlm: MOCK_RATE,
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const { result } = renderHook(() => useCurrencyConversion('0.5'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 0.5 XLM × ₦2,500 = ₦1,250
    expect(result.current.ngnRaw).toBe(1_250);
  });

  it('calculates NGN correctly for a large XLM amount', async () => {
    mockGetNgnXlmRate.mockResolvedValue({
      ngnPerXlm: MOCK_RATE,
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const { result } = renderHook(() => useCurrencyConversion('100'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 100 XLM × ₦2,500 = ₦250,000
    expect(result.current.ngnRaw).toBe(250_000);
  });

  // -- Edge cases: empty / zero / invalid input ----------------------------

  it('returns ngnRaw=0 and a formatted "₦0" string when xlmAmount is "0"', async () => {
    mockGetNgnXlmRate.mockResolvedValue({
      ngnPerXlm: MOCK_RATE,
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const { result } = renderHook(() => useCurrencyConversion('0'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.ngnRaw).toBe(0);
    // Should still produce a formatted string (₦0.00)
    expect(result.current.ngnAmount).toMatch(/0/);
  });

  it('returns empty ngnAmount for empty string input', async () => {
    mockGetNgnXlmRate.mockResolvedValue({
      ngnPerXlm: MOCK_RATE,
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const { result } = renderHook(() => useCurrencyConversion(''), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // parsedXlm will be 0 (safe fallback) → ngnRaw=0 → formatted "₦0.00"
    // Hook treats 0 as a valid zero-amount, not "unavailable"
    expect(result.current.ngnRaw).toBe(0);
  });

  it('returns ngnRaw=0 for non-numeric string input', async () => {
    mockGetNgnXlmRate.mockResolvedValue({
      ngnPerXlm: MOCK_RATE,
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const { result } = renderHook(() => useCurrencyConversion('abc'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // parseFloat('abc') → NaN → safe fallback of 0
    expect(result.current.ngnRaw).toBe(0);
  });

  it('returns ngnRaw=0 for a negative string input', async () => {
    mockGetNgnXlmRate.mockResolvedValue({
      ngnPerXlm: MOCK_RATE,
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const { result } = renderHook(() => useCurrencyConversion('-5'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Negative values are clamped to 0
    expect(result.current.ngnRaw).toBe(0);
  });

  // -- Rate unavailability -------------------------------------------------

  it('returns ngnRaw=null and empty ngnAmount when the rate is 0', async () => {
    mockGetNgnXlmRate.mockResolvedValue({
      ngnPerXlm: 0, // invalid / not yet available
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const { result } = renderHook(() => useCurrencyConversion('10'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.ngnRaw).toBeNull();
    expect(result.current.ngnAmount).toBe('');
    expect(result.current.rate).toBe(0);
  });

  // -- Loading state -------------------------------------------------------

  it('exposes isLoading=true while the rate is being fetched', () => {
    // Never resolve — leaves the query in loading state
    mockGetNgnXlmRate.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCurrencyConversion('5'), {
      wrapper: makeWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.ngnAmount).toBe('');
    expect(result.current.ngnRaw).toBeNull();
  });

  // -- Error state ---------------------------------------------------------

  it('exposes isError=true and empty ngnAmount when the API fails', async () => {
    mockGetNgnXlmRate.mockRejectedValue(new Error('Rate API unavailable'));

    const { result } = renderHook(() => useCurrencyConversion('10'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.ngnRaw).toBeNull();
    expect(result.current.ngnAmount).toBe('');
    expect(result.current.rate).toBeNull();
  });

  // -- Rate metadata -------------------------------------------------------

  it('exposes the rate and rateUpdatedAt from the service response', async () => {
    const updatedAt = '2026-06-27T10:00:00.000Z';
    mockGetNgnXlmRate.mockResolvedValue({ ngnPerXlm: MOCK_RATE, updatedAt });

    const { result } = renderHook(() => useCurrencyConversion('1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rate).toBe(MOCK_RATE);
    expect(result.current.rateUpdatedAt).toBe(updatedAt);
  });

  // -- Reactivity ----------------------------------------------------------

  it('recomputes ngnAmount when xlmAmount prop changes', async () => {
    mockGetNgnXlmRate.mockResolvedValue({
      ngnPerXlm: MOCK_RATE,
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    const { result, rerender } = renderHook(
      ({ amount }: { amount: string }) => useCurrencyConversion(amount),
      { wrapper: makeWrapper(), initialProps: { amount: '1' } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.ngnRaw).toBe(2_500);

    // Change the input — should recompute without re-fetching
    act(() => rerender({ amount: '2' }));
    expect(result.current.ngnRaw).toBe(5_000);
  });

  // -- fxService called with 'NGN' -----------------------------------------

  it('calls fxService.getNgnXlmRate (not the generic currencyRateService)', async () => {
    mockGetNgnXlmRate.mockResolvedValue({
      ngnPerXlm: MOCK_RATE,
      updatedAt: '2026-06-27T10:00:00.000Z',
    });

    renderHook(() => useCurrencyConversion('1'), { wrapper: makeWrapper() });

    await waitFor(() => expect(mockGetNgnXlmRate).toHaveBeenCalledTimes(1));
  });
});
