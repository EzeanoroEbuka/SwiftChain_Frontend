import { renderHook, act, waitFor } from '@testing-library/react';
import { useMultiSigApprovals } from '@/hooks/useMultiSigApprovals';
import * as walletServiceModule from '@/services/walletService';
import * as freighterServiceModule from '@/services/freighterService';

// Mock the services
jest.mock('@/services/walletService');
jest.mock('@/services/freighterService');

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockWalletService = walletServiceModule.walletService as jest.Mocked<
  typeof walletServiceModule.walletService
>;

const mockFreighterService = freighterServiceModule.freighterService as jest.Mocked<
  typeof freighterServiceModule.freighterService
>;

const MOCK_OPERATION = {
  operationId: 'op-001',
  transactionEnvelope: 'AAAAAgAAAABa+Cd7L3r0w....',
  description: 'Test transaction',
  signaturesRequired: 2,
  currentSignatures: 1,
  signers: [
    { publicKey: 'GACV3JHPXU7CKKYIRSTNLPFVFWGCAYDGBVNFNFJDG5BFCPJV7ZRKJSGN', weight: 1, approved: true },
    { publicKey: 'GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIRUUOKLVFEFK4QB26WVJDBKFEA', weight: 1, approved: false },
  ],
  createdAt: '2026-06-01T10:00:00Z',
  status: 'pending' as const,
  expiresAt: '2026-06-08T10:00:00Z',
};

describe('useMultiSigApprovals Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return initial state', () => {
    const { result } = renderHook(() => useMultiSigApprovals());

    expect(result.current.operations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSigning).toBe(false);
    expect(typeof result.current.fetchPendingOperations).toBe('function');
    expect(typeof result.current.signOperation).toBe('function');
    expect(typeof result.current.refreshOperations).toBe('function');
  });

  test('should successfully fetch pending operations', async () => {
    mockWalletService.getPendingMultiSigOperations.mockResolvedValueOnce({
      success: true,
      message: 'Operations fetched',
      operations: [MOCK_OPERATION],
    });

    const { result } = renderHook(() => useMultiSigApprovals());

    await act(async () => {
      await result.current.fetchPendingOperations('0xTest');
    });

    await waitFor(() => {
      expect(result.current.operations).toEqual([MOCK_OPERATION]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  test('should handle failed operation fetch', async () => {
    mockWalletService.getPendingMultiSigOperations.mockResolvedValueOnce({
      success: false,
      message: 'Failed to fetch operations',
    });

    const { result } = renderHook(() => useMultiSigApprovals());

    await act(async () => {
      await result.current.fetchPendingOperations('0xTest');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch operations');
      expect(result.current.operations).toEqual([]);
    });
  });

  test('should handle error during operation fetch', async () => {
    mockWalletService.getPendingMultiSigOperations.mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() => useMultiSigApprovals());

    await act(async () => {
      await result.current.fetchPendingOperations('0xTest');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  test('should sign an operation successfully', async () => {
    mockWalletService.getPendingMultiSigOperations.mockResolvedValueOnce({
      success: true,
      message: 'Operations fetched',
      operations: [MOCK_OPERATION],
    });

    mockFreighterService.getPublicKey.mockResolvedValueOnce(
      'GACV3JHPXU7CKKYIRSTNLPFVFWGCAYDGBVNFNFJDG5BFCPJV7ZRKJSGN'
    );

    mockFreighterService.signTransaction.mockResolvedValueOnce('signature123');

    mockWalletService.signMultiSigOperation.mockResolvedValueOnce({
      success: true,
      message: 'Signature submitted',
      operationId: 'op-001',
      currentSignatures: 2,
    });

    const { result } = renderHook(() => useMultiSigApprovals());

    // First fetch operations
    await act(async () => {
      await result.current.fetchPendingOperations('0xTest');
    });

    // Then sign an operation
    await act(async () => {
      await result.current.signOperation(MOCK_OPERATION);
    });

    await waitFor(() => {
      expect(result.current.isSigning).toBe(false);
      expect(mockFreighterService.getPublicKey).toHaveBeenCalled();
      expect(mockFreighterService.signTransaction).toHaveBeenCalledWith(
        MOCK_OPERATION.transactionEnvelope
      );
      expect(mockWalletService.signMultiSigOperation).toHaveBeenCalled();
    });
  });

  test('should update operation state after successful signing', async () => {
    mockWalletService.getPendingMultiSigOperations.mockResolvedValueOnce({
      success: true,
      message: 'Operations fetched',
      operations: [MOCK_OPERATION],
    });

    mockFreighterService.getPublicKey.mockResolvedValueOnce(
      'GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIRUUOKLVFEFK4QB26WVJDBKFEA'
    );

    mockFreighterService.signTransaction.mockResolvedValueOnce('signature456');

    mockWalletService.signMultiSigOperation.mockResolvedValueOnce({
      success: true,
      message: 'Signature submitted',
      operationId: 'op-001',
      currentSignatures: 2,
    });

    const { result } = renderHook(() => useMultiSigApprovals());

    // Fetch operations first
    await act(async () => {
      await result.current.fetchPendingOperations('0xTest');
    });

    // Sign the operation
    await act(async () => {
      await result.current.signOperation(MOCK_OPERATION);
    });

    await waitFor(() => {
      // Verify that the operation's signature count was updated
      const updatedOp = result.current.operations[0];
      expect(updatedOp.currentSignatures).toBe(2);
      // Verify that the signer's approval status was updated
      const updatedSigner = updatedOp.signers.find(
        (s) => s.publicKey === 'GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIRUUOKLVFEFK4QB26WVJDBKFEA'
      );
      expect(updatedSigner?.approved).toBe(true);
    });
  });

  test('should handle failed signature submission', async () => {
    mockWalletService.getPendingMultiSigOperations.mockResolvedValueOnce({
      success: true,
      message: 'Operations fetched',
      operations: [MOCK_OPERATION],
    });

    mockFreighterService.getPublicKey.mockResolvedValueOnce(
      'GACV3JHPXU7CKKYIRSTNLPFVFWGCAYDGBVNFNFJDG5BFCPJV7ZRKJSGN'
    );

    mockFreighterService.signTransaction.mockResolvedValueOnce('signature789');

    mockWalletService.signMultiSigOperation.mockResolvedValueOnce({
      success: false,
      message: 'Invalid signature',
    });

    const { result } = renderHook(() => useMultiSigApprovals());

    await act(async () => {
      await result.current.fetchPendingOperations('0xTest');
    });

    await act(async () => {
      await result.current.signOperation(MOCK_OPERATION);
    });

    await waitFor(() => {
      expect(result.current.isSigning).toBe(false);
    });
  });

  test('should handle Freighter signature error', async () => {
    mockWalletService.getPendingMultiSigOperations.mockResolvedValueOnce({
      success: true,
      message: 'Operations fetched',
      operations: [MOCK_OPERATION],
    });

    mockFreighterService.getPublicKey.mockResolvedValueOnce(
      'GACV3JHPXU7CKKYIRSTNLPFVFWGCAYDGBVNFNFJDG5BFCPJV7ZRKJSGN'
    );

    mockFreighterService.signTransaction.mockRejectedValueOnce(
      new Error('User rejected signature')
    );

    const { result } = renderHook(() => useMultiSigApprovals());

    await act(async () => {
      await result.current.fetchPendingOperations('0xTest');
    });

    await act(async () => {
      await result.current.signOperation(MOCK_OPERATION);
    });

    await waitFor(() => {
      expect(result.current.isSigning).toBe(false);
    });
  });

  test('should refresh operations', async () => {
    mockWalletService.getPendingMultiSigOperations.mockResolvedValueOnce({
      success: true,
      message: 'Operations fetched',
      operations: [MOCK_OPERATION],
    });

    const { result } = renderHook(() => useMultiSigApprovals());

    await act(async () => {
      await result.current.refreshOperations('0xTest');
    });

    expect(mockWalletService.getPendingMultiSigOperations).toHaveBeenCalledWith('0xTest');
  });

  test('should handle loading state during fetch', async () => {
    const delayedPromise = new Promise((resolve) =>
      setTimeout(() => resolve({
        success: true,
        message: 'Operations fetched',
        operations: [MOCK_OPERATION],
      }), 100)
    );

    mockWalletService.getPendingMultiSigOperations.mockReturnValueOnce(
      delayedPromise as any
    );

    const { result } = renderHook(() => useMultiSigApprovals());

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      result.current.fetchPendingOperations('0xTest');
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  test('should handle multiple operations', async () => {
    const operation2 = {
      ...MOCK_OPERATION,
      operationId: 'op-002',
      description: 'Another transaction',
    };

    mockWalletService.getPendingMultiSigOperations.mockResolvedValueOnce({
      success: true,
      message: 'Operations fetched',
      operations: [MOCK_OPERATION, operation2],
    });

    const { result } = renderHook(() => useMultiSigApprovals());

    await act(async () => {
      await result.current.fetchPendingOperations('0xTest');
    });

    await waitFor(() => {
      expect(result.current.operations).toHaveLength(2);
      expect(result.current.operations[0].operationId).toBe('op-001');
      expect(result.current.operations[1].operationId).toBe('op-002');
    });
  });

  test('should pass correct parameters to sign service', async () => {
    mockWalletService.getPendingMultiSigOperations.mockResolvedValueOnce({
      success: true,
      message: 'Operations fetched',
      operations: [MOCK_OPERATION],
    });

    mockFreighterService.getPublicKey.mockResolvedValueOnce(
      'GACV3JHPXU7CKKYIRSTNLPFVFWGCAYDGBVNFNFJDG5BFCPJV7ZRKJSGN'
    );

    mockFreighterService.signTransaction.mockResolvedValueOnce('sig_123');

    mockWalletService.signMultiSigOperation.mockResolvedValueOnce({
      success: true,
      message: 'Signature submitted',
      currentSignatures: 2,
    });

    const { result } = renderHook(() => useMultiSigApprovals());

    await act(async () => {
      await result.current.fetchPendingOperations('0xTest');
    });

    await act(async () => {
      await result.current.signOperation(MOCK_OPERATION);
    });

    await waitFor(() => {
      expect(mockWalletService.signMultiSigOperation).toHaveBeenCalledWith({
        operationId: 'op-001',
        signature: 'sig_123',
        signerPublicKey: 'GACV3JHPXU7CKKYIRSTNLPFVFWGCAYDGBVNFNFJDG5BFCPJV7ZRKJSGN',
      });
    });
  });
});
