'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';

export interface UseAccountMenuResult {
  address: string | null;
  isConnected: boolean;
  isCopied: boolean;
  isDisconnecting: boolean;
  truncatedAddress: string;
  copyAddress: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * useAccountMenu — state and actions for the wallet account header dropdown.
 *
 * Layered Architecture:
 *   AccountMenu (Component) → useAccountMenu (Hook) → useWallet → walletService (Service)
 *
 * The wallet address originates from the backend API response (walletService.connect).
 * This hook derives the truncated display and adds clipboard + disconnect orchestration.
 */
export function useAccountMenu(): UseAccountMenuResult {
  const { address, isConnected, disconnect: disconnectWallet } = useWallet();
  const [isCopied, setIsCopied] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const truncatedAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-6)}`
    : '';

  const copyAddress = useCallback(async (): Promise<void> => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [address]);

  const disconnect = useCallback(async (): Promise<void> => {
    setIsDisconnecting(true);
    try {
      await disconnectWallet();
    } finally {
      setIsDisconnecting(false);
    }
  }, [disconnectWallet]);

  return {
    address,
    isConnected,
    isCopied,
    isDisconnecting,
    truncatedAddress,
    copyAddress,
    disconnect,
  };
}
