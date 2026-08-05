/**
 * qrCacheService — Service layer for offline QR payload persistence.
 *
 * Responsibilities:
 *  - Store / retrieve HandoffQRData in IndexedDB so drivers can generate
 *    QR codes even when fully offline.
 *  - Maintain a queue of successful scan confirmations that must be synced
 *    to the backend once connectivity is restored.
 *
 * Follows the singleton pattern used elsewhere in this service layer.
 */

import { HandoffQRData } from '@/types/shipment';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScanConfirmation {
  deliveryId: string;
  token: string;
  scannedAt: string; // ISO timestamp
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DB_NAME = 'swiftchain_qr_cache';
const DB_VERSION = 1;
const STORE_PAYLOAD = 'qr_payloads';
const STORE_QUEUE = 'scan_queue';

// ─── IndexedDB bootstrap ──────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PAYLOAD)) {
        db.createObjectStore(STORE_PAYLOAD, { keyPath: 'deliveryId' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        // Auto-increment key — one entry per queued confirmation
        db.createObjectStore(STORE_QUEUE, { autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Service class ────────────────────────────────────────────────────────────

class QrCacheService {
  // ── Payload cache ──────────────────────────────────────────────────────────

  /**
   * Persist the latest live payload for a delivery.
   * Call this immediately after a successful API fetch.
   */
  async savePayload(payload: HandoffQRData): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PAYLOAD, 'readwrite');
      tx.objectStore(STORE_PAYLOAD).put(payload);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Retrieve the cached payload for a delivery.
   * Returns `null` if no cache entry exists.
   */
  async getPayload(deliveryId: string): Promise<HandoffQRData | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PAYLOAD, 'readonly');
      const request = tx.objectStore(STORE_PAYLOAD).get(deliveryId);
      request.onsuccess = () => resolve((request.result as HandoffQRData) ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove the cached payload for a delivery (e.g. after a confirmed handoff).
   */
  async clearPayload(deliveryId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PAYLOAD, 'readwrite');
      tx.objectStore(STORE_PAYLOAD).delete(deliveryId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── Scan confirmation queue ────────────────────────────────────────────────

  /**
   * Enqueue a scan confirmation to be synced once connectivity returns.
   */
  async queueScanConfirmation(confirmation: ScanConfirmation): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      tx.objectStore(STORE_QUEUE).add(confirmation);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Return all queued confirmations (in insertion order).
   */
  async getPendingConfirmations(): Promise<Array<{ key: IDBValidKey; value: ScanConfirmation }>> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const results: Array<{ key: IDBValidKey; value: ScanConfirmation }> = [];
      const tx = db.transaction(STORE_QUEUE, 'readonly');
      const request = tx.objectStore(STORE_QUEUE).openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          results.push({ key: cursor.key, value: cursor.value as ScanConfirmation });
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove a synced confirmation from the queue by its IDB key.
   */
  async removeConfirmation(key: IDBValidKey): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      tx.objectStore(STORE_QUEUE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Return the number of confirmations waiting to be synced.
   */
  async pendingCount(): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readonly');
      const request = tx.objectStore(STORE_QUEUE).count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const qrCacheService = new QrCacheService();
