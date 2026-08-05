import { sessionService } from '@/services/sessionService';
import { useWalletStore, WALLET_STORAGE_KEY } from '@/store/walletStore';

jest.mock('@/store/walletStore', () => ({
  useWalletStore: {
    getState: jest.fn(),
  },
  WALLET_STORAGE_KEY: 'swiftchain_wallet',
}));

describe('sessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('clears wallet state and removes persisted wallet storage key', () => {
    const clearWalletState = jest.fn();
    (useWalletStore.getState as jest.Mock).mockReturnValue({
      clearWalletState,
    });

    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify({ address: 'GABC123DEF456STELLAR' }));

    sessionService.clearWalletSession();

    expect(clearWalletState).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(WALLET_STORAGE_KEY)).toBeNull();
  });
});
