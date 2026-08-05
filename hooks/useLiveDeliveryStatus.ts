import { useState, useEffect } from 'react';
import {
  deliverySocketService,
  DeliveryStatus,
} from '../services/deliverySocketService';

export interface LiveDeliveryStatusResult {
  status: DeliveryStatus;
  isConnected: boolean;
}

/**
 * useLiveDeliveryStatus — Hook layer for real-time delivery status.
 *
 * Follows the Component -> Hook -> Service pattern:
 * - Opens a WebSocket connection via `deliverySocketService` on mount.
 * - Reflects actual socket open/close state in `isConnected`.
 * - Cleans up the connection on unmount or when `deliveryId` changes.
 *
 * @param deliveryId - The ID of the delivery to track.
 * @returns `{ status, isConnected }` — reactive status and connection state.
 */
export const useLiveDeliveryStatus = (
  deliveryId: string,
): LiveDeliveryStatusResult => {
  const [status, setStatus] = useState<DeliveryStatus>('PENDING');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!deliveryId) return;

    deliverySocketService.connect(deliveryId, {
      onConnected: () => setIsConnected(true),
      onStatusUpdate: (newStatus) => setStatus(newStatus),
      onDisconnected: () => setIsConnected(false),
      onError: () => setIsConnected(false),
    });

    return () => {
      deliverySocketService.disconnect();
      setIsConnected(false);
    };
  }, [deliveryId]);

  return { status, isConnected };
};
