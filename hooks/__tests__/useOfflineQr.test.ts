/**
 * useOfflineQr — unit tests
 *
 * Key scenarios:
 *  - Returns live payload when API succeeds
 *  - Falls back to cache on network timeout
 *  - Falls back to cache when navigator.onLine is false
 *  - Reports error when both API and cache are unavailable
 *  - Queues a scan confirmation and flushes it when online
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineQr } from '../useOfflineQr';
import { shipmentHandoffService } from '@/services/shipmentHandoffService';
import { qrCacheService } from '@/services/qrCacheService';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/services/shipmentHandoffService');
jest.mock('@/services/qrCacheService');

const mockService = shipmentHandoffService as jest.Mocked<typeof shipmentHandoffService>;
const mockCache = qrCacheService as jest.Mocked<typeof qrCacheService>;

const DELIVERY_ID = 'del-001';

const mockPayload = {
  qrData: 'https://example.com/qr/abc',
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  deliveryId: DELIVERY_ID,
  token: 'tok-abc',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setupCacheDefaults() {
  mockCache.savePayload.mockResolvedValue(undefined);
  mockCache.getPayload.mockResolvedValue(null);
  mockCache.getPendingConfirmations.mockResolvedValue([]);
  mockCache.pendingCount.mockResolvedValue(0);
  mockCache.queueScanConfirmation.mockResolvedValue(undefined);
  mockCache.removeConfirmation.mockResolvedValue(undefined);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setupCacheDefaults();
});

describe('useOfflineQr — live fetch success', () => {
  it('returns live payload and source="live" when API succeeds', async () => {
    mockService.getHandoffQR.mockResolvedValue(mockPayload);

    const { result } = renderHook(() => useOfflineQr(DELIVERY_ID));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.payload).toEqual(mockPayload);
    expect(result.current.source).toBe('live');
    expect(result.current.error).toBeNull();
  });

  it('persists payload to cache after a successful live fetch', async () => {
    mockService.getHandoffQR.mockResolvedValue(mockPayload);

    renderHook(() => useOfflineQr(DELIVERY_ID));

    await waitFor(() => {
      expect(mockCache.savePayload).toHaveBeenCalledWith(mockPayload);
    });
  });
});

describe('useOfflineQr — offline / timeout fallback', () => {
  it('returns cached payload and source="cached" when API times out', async () => {
    // API never resolves within the 5 s window — fake with a long delay
    mockService.getHandoffQR.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockPayload), 10_000)),
    );
    mockCache.getPayload.mockResolvedValue(mockPayload);

    // Fake timers so the 5 s timeout fires immediately
    jest.useFakeTimers();

    const { result } = renderHook(() => useOfflineQr(DELIVERY_ID));

    act(() => { jest.advanceTimersByTime(6_000); });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.source).toBe('cached');
    expect(result.current.payload).toEqual(mockPayload);
    expect(result.current.error).toBeNull();

    jest.useRealTimers();
  });

  it('returns error when API fails and cache is empty', async () => {
    mockService.getHandoffQR.mockRejectedValue(new Error('Network error'));
    mockCache.getPayload.mockResolvedValue(null);

    const { result } = renderHook(() => useOfflineQr(DELIVERY_ID));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.payload).toBeNull();
    expect(result.current.error).toMatch(/Unable to load QR/);
  });

  it('falls back to cache when API rejects', async () => {
    mockService.getHandoffQR.mockRejectedValue(new Error('503'));
    mockCache.getPayload.mockResolvedValue(mockPayload);

    const { result } = renderHook(() => useOfflineQr(DELIVERY_ID));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.source).toBe('cached');
    expect(result.current.payload).toEqual(mockPayload);
  });
});

describe('useOfflineQr — scan confirmation queue', () => {
  it('queues a scan confirmation via queueScan()', async () => {
    mockService.getHandoffQR.mockResolvedValue(mockPayload);

    const { result } = renderHook(() => useOfflineQr(DELIVERY_ID));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const confirmation = {
      deliveryId: DELIVERY_ID,
      token: 'tok-abc',
      scannedAt: new Date().toISOString(),
    };

    await act(async () => {
      await result.current.queueScan(confirmation);
    });

    expect(mockCache.queueScanConfirmation).toHaveBeenCalledWith(confirmation);
  });

  it('flushes queue immediately when online after queueScan()', async () => {
    mockService.getHandoffQR.mockResolvedValue(mockPayload);
    mockService.verifyHandoffQR.mockResolvedValue({
      id: 'v1',
      deliveryId: DELIVERY_ID,
      token: 'tok-abc',
      expiresAt: mockPayload.expiresAt,
      createdAt: new Date().toISOString(),
    });
    // Return one pending confirmation on the first call, then 0 afterwards
    mockCache.getPendingConfirmations
      .mockResolvedValueOnce([{ key: 1, value: { deliveryId: DELIVERY_ID, token: 'tok-abc', scannedAt: '' } }])
      .mockResolvedValue([]);
    mockCache.pendingCount.mockResolvedValue(0);

    // Simulate being online
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    const { result } = renderHook(() => useOfflineQr(DELIVERY_ID));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.queueScan({ deliveryId: DELIVERY_ID, token: 'tok-abc', scannedAt: '' });
    });

    expect(mockService.verifyHandoffQR).toHaveBeenCalledWith(DELIVERY_ID, 'tok-abc');
    expect(mockCache.removeConfirmation).toHaveBeenCalledWith(1);
  });
});

describe('useOfflineQr — online event sync', () => {
  it('flushes pending queue when browser comes back online', async () => {
    mockService.getHandoffQR.mockResolvedValue(mockPayload);
    mockService.verifyHandoffQR.mockResolvedValue({
      id: 'v2',
      deliveryId: DELIVERY_ID,
      token: 'tok-xyz',
      expiresAt: mockPayload.expiresAt,
      createdAt: new Date().toISOString(),
    });
    mockCache.getPendingConfirmations.mockResolvedValue([
      { key: 42, value: { deliveryId: DELIVERY_ID, token: 'tok-xyz', scannedAt: '' } },
    ]);
    mockCache.pendingCount.mockResolvedValue(0);

    renderHook(() => useOfflineQr(DELIVERY_ID));

    // Simulate coming back online
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(mockService.verifyHandoffQR).toHaveBeenCalledWith(DELIVERY_ID, 'tok-xyz');
    });
  });
});

describe('useOfflineQr — refresh', () => {
  it('re-fetches and updates source to "live" on manual refresh', async () => {
    mockService.getHandoffQR
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(mockPayload);
    mockCache.getPayload.mockResolvedValue(mockPayload);

    const { result } = renderHook(() => useOfflineQr(DELIVERY_ID));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.source).toBe('cached');

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.source).toBe('live');
  });
});
