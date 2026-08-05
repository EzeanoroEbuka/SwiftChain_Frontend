import { renderHook, act } from '@testing-library/react';
import { useEscrowLock } from '@/hooks/useEscrowLock';
import { escrowService, LockEscrowParams } from '@/services/escrowService';

jest.mock('@/services/escrowService');

describe('useEscrowLock', () => {
  const mockEscrowService = escrowService as jest.Mocked<typeof escrowService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with idle state', () => {
    const { result } = renderHook(() => useEscrowLock());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.escrowId).toBeNull();
    expect(result.current.transactionHash).toBeNull();
  });

  it('sets isLoading to true before lock request', async () => {
    let loadingState: boolean | null = null;

    mockEscrowService.lockEscrow.mockImplementation(async () => {
      loadingState = true;
      return {
        success: true,
        message: 'Locked',
        escrowId: 'escrow-123',
        transactionHash: '0xabc',
        lockedAmount: '100',
      };
    });

    const { result } = renderHook(() => useEscrowLock());

    await act(async () => {
      try {
        await result.current.lockEscrow({
          deliveryId: 'delivery-1',
          amount: 100,
          currency: 'USDC',
          walletAddress: '0x123',
        });
      } catch {}
    });

    expect(loadingState).toBe(true);
  });

  it('sets state on successful lock', async () => {
    mockEscrowService.lockEscrow.mockResolvedValue({
      success: true,
      message: 'Locked',
      escrowId: 'escrow-123',
      transactionHash: '0xabc123',
      lockedAmount: '100.50',
    });

    const { result } = renderHook(() => useEscrowLock());

    await act(async () => {
      await result.current.lockEscrow({
        deliveryId: 'delivery-1',
        amount: 100.5,
        currency: 'USDC',
        walletAddress: '0x123...789',
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.escrowId).toBe('escrow-123');
    expect(result.current.transactionHash).toBe('0xabc123');
  });

  it('sets error state on lock failure', async () => {
    const error = new Error('Insufficient funds');
    mockEscrowService.lockEscrow.mockRejectedValue(error);

    const { result } = renderHook(() => useEscrowLock());

    await act(async () => {
      try {
        await result.current.lockEscrow({
          deliveryId: 'delivery-1',
          amount: 100.5,
          currency: 'USDC',
          walletAddress: '0x123...789',
        });
      } catch {}
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Insufficient funds');
    expect(result.current.escrowId).toBeNull();
    expect(result.current.transactionHash).toBeNull();
  });

  it('passes correct parameters to service', async () => {
    mockEscrowService.lockEscrow.mockResolvedValue({
      success: true,
      message: 'Locked',
      escrowId: 'escrow-123',
      transactionHash: '0xabc123',
      lockedAmount: '100.50',
    });

    const { result } = renderHook(() => useEscrowLock());
    const params: LockEscrowParams = {
      deliveryId: 'delivery-1',
      amount: 100.5,
      currency: 'USDC',
      walletAddress: '0x123...789',
    };

    await act(async () => {
      await result.current.lockEscrow(params);
    });

    expect(mockEscrowService.lockEscrow).toHaveBeenCalledWith(params);
  });

  it('resets state to initial values', async () => {
    mockEscrowService.lockEscrow.mockResolvedValue({
      success: true,
      message: 'Locked',
      escrowId: 'escrow-123',
      transactionHash: '0xabc123',
      lockedAmount: '100.50',
    });

    const { result } = renderHook(() => useEscrowLock());

    // Lock escrow
    await act(async () => {
      await result.current.lockEscrow({
        deliveryId: 'delivery-1',
        amount: 100.5,
        currency: 'USDC',
        walletAddress: '0x123...789',
      });
    });

    expect(result.current.escrowId).toBe('escrow-123');

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.escrowId).toBeNull();
    expect(result.current.transactionHash).toBeNull();
  });

  it('handles generic error messages', async () => {
    mockEscrowService.lockEscrow.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEscrowLock());

    await act(async () => {
      try {
        await result.current.lockEscrow({
          deliveryId: 'delivery-1',
          amount: 100.5,
          currency: 'USDC',
          walletAddress: '0x123...789',
        });
      } catch {}
    });

    expect(result.current.error).toBe('Network error');
  });

  it('handles non-Error exceptions', async () => {
    mockEscrowService.lockEscrow.mockRejectedValue('Unknown error');

    const { result } = renderHook(() => useEscrowLock());

    await act(async () => {
      try {
        await result.current.lockEscrow({
          deliveryId: 'delivery-1',
          amount: 100.5,
          currency: 'USDC',
          walletAddress: '0x123...789',
        });
      } catch {}
    });

    expect(result.current.error).toBe('Failed to lock escrow');
  });

  it('throws error after setting state', async () => {
    const error = new Error('Lock failed');
    mockEscrowService.lockEscrow.mockRejectedValue(error);

    const { result } = renderHook(() => useEscrowLock());

    let thrownError: Error | null = null;

    await act(async () => {
      try {
        await result.current.lockEscrow({
          deliveryId: 'delivery-1',
          amount: 100.5,
          currency: 'USDC',
          walletAddress: '0x123...789',
        });
      } catch (err) {
        thrownError = err as Error;
      }
    });

    expect(thrownError).toBe(error);
  });

  it('clears previous error on retry', async () => {
    mockEscrowService.lockEscrow.mockRejectedValueOnce(new Error('First error'));
    mockEscrowService.lockEscrow.mockResolvedValueOnce({
      success: true,
      message: 'Locked',
      escrowId: 'escrow-123',
      transactionHash: '0xabc123',
      lockedAmount: '100.50',
    });

    const { result } = renderHook(() => useEscrowLock());

    // First attempt - fails
    await act(async () => {
      try {
        await result.current.lockEscrow({
          deliveryId: 'delivery-1',
          amount: 100.5,
          currency: 'USDC',
          walletAddress: '0x123...789',
        });
      } catch {}
    });

    expect(result.current.error).toBe('First error');

    // Second attempt - succeeds
    await act(async () => {
      await result.current.lockEscrow({
        deliveryId: 'delivery-1',
        amount: 100.5,
        currency: 'USDC',
        walletAddress: '0x123...789',
      });
    });

    expect(result.current.error).toBeNull();
    expect(result.current.escrowId).toBe('escrow-123');
  });
});
