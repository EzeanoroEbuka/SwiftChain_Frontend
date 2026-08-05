'use client';

import { render, screen, fireEvent, act } from '@testing-library/react';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { useWallet } from '@/hooks/useWallet';
import useOffline from '@/hooks/useOffline';

const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

jest.mock('@/hooks/useWallet', () => ({
  useWallet: jest.fn(),
}));

jest.mock('@/hooks/useOffline', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('WalletConnect component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders disconnect button when wallet is connected', () => {
    (useWallet as jest.Mock).mockReturnValue({
      address: 'GABC123DEF456STELLAR',
      isConnected: true,
      isFreighterInstalled: true,
      isConnecting: false,
      connectError: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
    });
    (useOffline as jest.Mock).mockReturnValue({ isOnline: true });

    render(<WalletConnect />);

    expect(
      screen.getByRole('button', { name: /disconnect/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/GABC123DEF456STELLAR/i)).toBeInTheDocument();
  });

  it('calls disconnect when disconnect button is clicked', async () => {
    (useWallet as jest.Mock).mockReturnValue({
      address: 'GABC123DEF456STELLAR',
      isConnected: true,
      isFreighterInstalled: true,
      isConnecting: false,
      connectError: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
    });
    (useOffline as jest.Mock).mockReturnValue({ isOnline: true });

    render(<WalletConnect />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /disconnect/i }));
    });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});
