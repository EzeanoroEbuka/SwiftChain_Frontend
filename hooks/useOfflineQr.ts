'use client';

/**
 * useOfflineQr — Hook layer for offline-ready QR code handoff.
 *
 * Strategy:
 *  1. Attempt to fetch the latest payload from the backend API (5 s timeout).
 *  2. On success — persist to IndexedDB and return the live payload.
 *  3. On timeout / network failure — return the cached payload from IndexedDB.
 *  4. Listen for the browser `online` event to flush the pending scan
 *     confirmation queue and refresh the live payload.
 *
 * Component → Hook → Service pattern:
 *   QrGenerator (component) → useOfflineQr (hook)
 *     → shipmentHandoffService (API)
 *     → qrCacheService (IndexedDB)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { shipmentHandoffService } from '@/services/shipmentHandoffService';
import { qrCacheService, ScanConfirmation } from '@/services/qrCacheService';
import { HandoffQRData } from '@/types/shipment';

// ─── Types ────────────────────────────────────────────────────────────────────

export type QrSource = 'live' | 'cached';

export interface UseOfflineQrResult {
  /** The QR payload to render — either live or from cache. */
  payload: HandoffQRData | null;
  /** Where the current payload came from. */
  source: QrSource | null;
  /** True while the initial fetch / cache lookup is in progress. */
  isLoading: boolean;
  /** Error message when both live fetch and cache are unavailable. */
  error: string | null;
  /** True when queued scan confirmations are waiting to be synced. */
  isSyncing: boolean;
  /** Number of confirmations still in the queue. */
  pendingCount: number;
  /** Queue a successful scan for background sync. */
  queueScan: (confirmation: ScanConfirmation) => Promise<void>;
  /** Manually trigger a live refresh. */
  refresh: () => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 5_000;

// ─── Helper ───────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('Request timed out')), ms);
    promise.then(
      (val) => { clearTimeout(id); resolve(val); },
      (err) => { clearTimeout(id); reject(err); },
    );
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOfflineQr(deliveryId: string): UseOfflineQrResult {
  const [payload, setPayload] = useState<HandoffQRData | null>(null);
  const [source, setSource] = useState<QrSource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const mountedRef = useRef(true);

  // ── Core fetch logic ─────────────────────────────────────────────────────

  const fetchAndCache = useCallback(async () => {
    if (!deliveryId) return;

    try {
      const live = await withTimeout(
        shipmentHandoffService.getHandoffQR(deliveryId),
        FETCH_TIMEOUT_MS,
      );
      // Persist immediately — driver may go offline at any time
      await qrCacheService.savePayload(live);
      if (mountedRef.current) {
        setPayload(live);
        setSource('live');
        setError(null);
      }
    } catch {
      // Live fetch failed — fall back to cache
      const cached = await qrCacheService.getPayload(deliveryId);
      if (!mountedRef.current) return;
      if (cached) {
        setPayload(cached);
        setSource('cached');
        setError(null);
      } else {
        setPayload(null);
        setSource(null);
        setError('Unable to load QR code. No cached data available.');
      }
    }
  }, [deliveryId]);

  // ── Sync queue flush ─────────────────────────────────────────────────────

  const flushQueue = useCallback(async () => {
    const pending = await qrCacheService.getPendingConfirmations();
    if (pending.length === 0) return;

    setIsSyncing(true);
    for (const { key, value } of pending) {
      try {
        await shipmentHandoffService.verifyHandoffQR(value.deliveryId, value.token);
        await qrCacheService.removeConfirmation(key);
      } catch {
        // Leave failed entries in the queue for the next online event
      }
    }
    const remaining = await qrCacheService.pendingCount();
    if (mountedRef.current) {
      setPendingCount(remaining);
      setIsSyncing(remaining > 0);
    }
  }, []);

  const syncPendingCount = useCallback(async () => {
    const count = await qrCacheService.pendingCount();
    if (mountedRef.current) {
      setPendingCount(count);
      setIsSyncing(count > 0);
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      setIsLoading(true);
      await fetchAndCache();
      await syncPendingCount();
      if (mountedRef.current) setIsLoading(false);
    };

    void init();

    return () => { mountedRef.current = false; };
  }, [deliveryId, fetchAndCache, syncPendingCount]);

  // ── Online event → flush queue + refresh ────────────────────────────────

  useEffect(() => {
    const handleOnline = () => {
      void flushQueue();
      void fetchAndCache();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [flushQueue, fetchAndCache]);

  // ── Public API ───────────────────────────────────────────────────────────

  const queueScan = useCallback(async (confirmation: ScanConfirmation) => {
    await qrCacheService.queueScanConfirmation(confirmation);
    await syncPendingCount();
    // Attempt immediate sync if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      await flushQueue();
    }
  }, [flushQueue, syncPendingCount]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchAndCache();
    if (mountedRef.current) setIsLoading(false);
  }, [fetchAndCache]);

  return { payload, source, isLoading, error, isSyncing, pendingCount, queueScan, refresh };
}
