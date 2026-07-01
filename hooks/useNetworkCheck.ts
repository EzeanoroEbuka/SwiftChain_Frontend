import { useState, useCallback, useEffect, useRef } from 'react';
import { networkService } from '@/services/networkService';

// Minimal local type for the network info returned by the backend.
// Keep this small to avoid coupling to a non-exported service type.
type NetworkInfo = {
  network: string;
  chainId?: number | null;
};

/** How often to re-check the network while a wallet is connected (ms). */
const POLL_INTERVAL_MS = 10_000;

export type NetworkStatus =
  | 'idle' // no wallet connected
  | 'loading' // first fetch in progress
  | 'match' // wallet network matches .env config
  | 'mismatch' // wallet is on the wrong network
  | 'error'; // fetch failed

/**
 * useNetworkCheck — polls the backend to detect whether the connected wallet
 * is on the expected Stellar network (from NEXT_PUBLIC_STELLAR_NETWORK).
 *
 * Returns:
 *  - `status`          — idle | loading | match | mismatch | error
 *  - `walletNetwork`   — the network the wallet reported (or null)
 *  - `expectedNetwork` — the value of NEXT_PUBLIC_STELLAR_NETWORK
 *  - `error`           — error message string when status === 'error'
 *  - `recheck`         — manually trigger a re-check immediately
 */
export function useNetworkCheck(address: string | null) {
  const expectedNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'testnet';

  const [walletNetwork, setWalletNetwork] = useState<NetworkInfo | null>(null);
  const [status, setStatus] = useState<NetworkStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    if (!address) {
      setStatus('idle');

      setWalletNetwork(null);
      return;
    }

    // Only show the loading spinner on the very first check.
    setStatus((prev) => (prev === 'idle' ? 'loading' : prev));
    setError(null);

    try {
      const response = await networkService.getWalletNetwork(address);
      if (response.success && response.data) {
        const incoming: NetworkInfo = response.data;

        // Determine match based on configured expected network (case-insensitive).
        const match =
          incoming.network?.toLowerCase() === expectedNetwork.toLowerCase();

        // Only update state when something actually changed. Use functional
        // updates to avoid reading stale values from the closure and to
        // prevent setting new object identities when the logical data is
        // identical — this prevents unnecessary re-renders (the likely
        // cause of the infinite loop reported).
        setWalletNetwork((prev) => {
          if (
            prev &&
            prev.network?.toLowerCase() === incoming.network?.toLowerCase() &&
            (prev.chainId ?? null) === (incoming.chainId ?? null)
          ) {
            return prev;
          }
          return incoming;
        });

        setStatus((prev) => {
          const newStatus: typeof status = match ? 'match' : 'mismatch';
          if (prev === newStatus) return prev;
          return newStatus;
        });
      } else {
        setError(response.message || 'Failed to check network');
        setStatus('error');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'An error occurred while checking network'
      );
      setStatus('error');
    }
  }, [address, expectedNetwork]);

  // Run immediately when address changes, then poll every POLL_INTERVAL_MS.
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!address) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('idle');

      setWalletNetwork(null);
      return;
    }

    void check();
    intervalRef.current = setInterval(() => void check(), POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [address, check]);

  return {
    status,
    walletNetwork,
    expectedNetwork,
    error,
    recheck: check,
  };
}
