import { renderHook, act } from '@testing-library/react';
import { useAccountMenu } from '@/hooks/useAccountMenu';

const mockDisconnect = jest.fn().mockResolvedValue(undefined);

jest.mock('@/hooks/useWallet', () => ({
  useWallet: jest.fn(() => ({
    address: 'GABC123DEF456STELLAR',
    isConnected: true,
    disconnect: mockDisconnect,
  })),
}));

// Provide clipboard API in jsdom
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('useAccountMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('reflects connected state and address from useWallet', () => {
    const { result } = renderHook(() => useAccountMenu());
    expect(result.current.isConnected).toBe(true);
    expect(result.current.address).toBe('GABC123DEF456STELLAR');
  });

  it('returns truncated address as first-6 … last-6 characters', () => {
    const { result } = renderHook(() => useAccountMenu());
    expect(result.current.truncatedAddress).toBe('GABC12…TELLAR');
  });

  it('starts with isCopied as false', () => {
    const { result } = renderHook(() => useAccountMenu());
    expect(result.current.isCopied).toBe(false);
  });

  it('starts with isDisconnecting as false', () => {
    const { result } = renderHook(() => useAccountMenu());
    expect(result.current.isDisconnecting).toBe(false);
  });

  describe('copyAddress', () => {
    it('writes the full address to the clipboard', async () => {
      const { result } = renderHook(() => useAccountMenu());
      await act(async () => {
        await result.current.copyAddress();
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'GABC123DEF456STELLAR'
      );
    });

    it('sets isCopied to true immediately after copy', async () => {
      const { result } = renderHook(() => useAccountMenu());
      await act(async () => {
        await result.current.copyAddress();
      });
      expect(result.current.isCopied).toBe(true);
    });

    it('resets isCopied to false after 2 seconds', async () => {
      const { result } = renderHook(() => useAccountMenu());
      await act(async () => {
        await result.current.copyAddress();
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(result.current.isCopied).toBe(false);
    });

    it('does nothing when address is null', async () => {
      const { useWallet } = jest.requireMock('@/hooks/useWallet');
      useWallet.mockReturnValueOnce({
        address: null,
        isConnected: false,
        disconnect: mockDisconnect,
      });
      const { result } = renderHook(() => useAccountMenu());
      await act(async () => {
        await result.current.copyAddress();
      });
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('calls the underlying useWallet disconnect', async () => {
      const { result } = renderHook(() => useAccountMenu());
      await act(async () => {
        await result.current.disconnect();
      });
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('resets isDisconnecting to false after disconnect resolves', async () => {
      const { result } = renderHook(() => useAccountMenu());
      await act(async () => {
        await result.current.disconnect();
      });
      expect(result.current.isDisconnecting).toBe(false);
    });

    it('resets isDisconnecting to false even when disconnect throws', async () => {
      mockDisconnect.mockRejectedValueOnce(new Error('Network failure'));
      const { result } = renderHook(() => useAccountMenu());
      await act(async () => {
        await result.current.disconnect();
      });
      expect(result.current.isDisconnecting).toBe(false);
    });
  });

  describe('truncatedAddress edge cases', () => {
    it('returns empty string when address is null', () => {
      const { useWallet } = jest.requireMock('@/hooks/useWallet');
      useWallet.mockReturnValueOnce({
        address: null,
        isConnected: false,
        disconnect: mockDisconnect,
      });
      const { result } = renderHook(() => useAccountMenu());
      expect(result.current.truncatedAddress).toBe('');
    });
  });
});
