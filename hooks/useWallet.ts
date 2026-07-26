import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletStore } from '@/store/walletStore';
import { walletService } from '@/services/walletService';
import { freighterService } from '@/services/freighterService';
import { sessionService } from '@/services/sessionService';

/**
 * useWallet — single hook for wallet session management.
 *
 * connect() three-step flow:
 *   1. Detect Freighter + request permission
 *   2. Retrieve public key from Freighter (browser extension)
 *   3. Register the public key with the backend API
 *   4. Persist the session in Zustand (synced to localStorage via persist middleware)
 *
 * disconnect() strict three-step security cleanup:
 *   1. Notifies the backend to invalidate the session
 *   2. Clears all wallet state from Zustand (strips public key from DOM)
 *   3. Redirects the user to /login
 *
 * Cleanup in step 2-3 runs unconditionally via `finally` — even if the
 * API call fails, the client-side session is always fully cleared.
 */
export function useWallet() {
  const router = useRouter();

  const address = useWalletStore((state) => state.address);
  const isConnected = useWalletStore((state) => state.isConnected);
  const setWallet = useWalletStore((state) => state.setWallet);
  const clearWalletState = useWalletStore((state) => state.clearWalletState);

  const [isFreighterInstalled, setIsFreighterInstalled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Detect Freighter on mount (client-side only)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsFreighterInstalled(freighterService.isInstalled());
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    if (!isFreighterInstalled) {
      setConnectError('Freighter wallet is not installed. Please install the extension.');
      return;
    }

    setIsConnecting(true);
    setConnectError(null);

    try {
      const publicKey = await freighterService.getPublicKey();

      const response = await walletService.connect(publicKey);

      if (!response.success) {
        throw new Error(response.message || 'Backend failed to confirm wallet connection');
      }

      setWallet(response.publicKey, 0);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while connecting your wallet';
      setConnectError(message);
    } finally {
      setIsConnecting(false);
    }
  }, [isFreighterInstalled, setWallet]);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await walletService.disconnect();
    } catch {
      // Session cleanup must run even when the API call fails
    } finally {
      sessionService.clearWalletSession();
      router.push('/login');
    }
  }, [router]);

  return {
    address,
    isConnected,
    isFreighterInstalled,
    isConnecting,
    connectError,
    connect,
    disconnect,
  };
}
