import { useWalletStore, WALLET_STORAGE_KEY } from '@/store/walletStore';

/**
 * sessionService — centralizes client-side wallet session cleanup.
 *
 * This service is part of the strict layered architecture:
 *   Component -> Hook -> Service
 *
 * The hook delegates storage and state teardown to this service layer.
 */
export const sessionService = {
  clearWalletSession(): void {
    useWalletStore.getState().clearWalletState();
    localStorage.removeItem(WALLET_STORAGE_KEY);
  },
};
