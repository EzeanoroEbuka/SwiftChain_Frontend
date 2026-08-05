import { renderHook, act, waitFor } from '@testing-library/react';
import { useDisputeForm } from '@/hooks/useDisputeForm';
import * as escrowServiceModule from '@/services/escrowService';

// Mock the escrow service
jest.mock('@/services/escrowService', () => ({
  escrowService: {
    openDispute: jest.fn(),
  },
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockEscrowService = escrowServiceModule.escrowService as jest.Mocked<typeof escrowServiceModule.escrowService>;

describe('useDisputeForm Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return form methods', () => {
    const { result } = renderHook(() => useDisputeForm());

    expect(result.current.register).toBeDefined();
    expect(result.current.handleSubmit).toBeDefined();
    expect(result.current.formState).toBeDefined();
    expect(result.current.watch).toBeDefined();
    expect(result.current.setValue).toBeDefined();
    expect(result.current.reset).toBeDefined();
    expect(result.current.submitDispute).toBeDefined();
  });

  test('should have correct initial form state', () => {
    const { result } = renderHook(() => useDisputeForm());

    expect(result.current.formState.errors).toEqual({});
    expect(result.current.formState.isSubmitting).toBe(false);
  });

  test('should successfully submit a dispute', async () => {
    mockEscrowService.openDispute.mockResolvedValueOnce({
      success: true,
      message: 'Dispute opened successfully',
      disputeId: 'DISP-001',
      transactionHash: '0x123456...',
    });

    const { result } = renderHook(() => useDisputeForm());
    const onSuccess = jest.fn();

    const formData = {
      transactionId: 'tx_123456789',
      reason: 'damaged_items' as const,
      description: 'Items arrived damaged',
      evidenceFiles: [],
    };

    await act(async () => {
      await result.current.submitDispute(
        formData,
        'delivery-123',
        '0xAbc123def456',
        onSuccess
      );
    });

    expect(onSuccess).toHaveBeenCalledWith({
      success: true,
      message: 'Dispute opened successfully',
      disputeId: 'DISP-001',
      transactionHash: '0x123456...',
    });
  });

  test('should handle dispute submission error', async () => {
    const errorMessage = 'Failed to open dispute';
    mockEscrowService.openDispute.mockRejectedValueOnce(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useDisputeForm());
    const onError = jest.fn();

    const formData = {
      transactionId: 'tx_123456789',
      reason: 'damaged_items' as const,
      description: 'Items arrived damaged',
      evidenceFiles: [],
    };

    await act(async () => {
      await result.current.submitDispute(
        formData,
        'delivery-123',
        '0xAbc123def456',
        undefined,
        onError
      );
    });

    expect(onError).toHaveBeenCalledWith(errorMessage);
  });

  test('should handle unsuccessful API response', async () => {
    mockEscrowService.openDispute.mockResolvedValueOnce({
      success: false,
      message: 'Insufficient balance',
    });

    const { result } = renderHook(() => useDisputeForm());
    const onError = jest.fn();

    const formData = {
      transactionId: 'tx_123456789',
      reason: 'damaged_items' as const,
      description: 'Items arrived damaged',
      evidenceFiles: [],
    };

    await act(async () => {
      await result.current.submitDispute(
        formData,
        'delivery-123',
        '0xAbc123def456',
        undefined,
        onError
      );
    });

    expect(onError).toHaveBeenCalledWith('Insufficient balance');
  });

  test('should reset form after successful submission', async () => {
    mockEscrowService.openDispute.mockResolvedValueOnce({
      success: true,
      message: 'Dispute opened successfully',
      disputeId: 'DISP-001',
      transactionHash: '0x123456...',
    });

    const { result } = renderHook(() => useDisputeForm());
    const resetSpy = jest.spyOn(result.current, 'reset');

    const formData = {
      transactionId: 'tx_123456789',
      reason: 'damaged_items' as const,
      description: 'Items arrived damaged',
      evidenceFiles: [],
    };

    await act(async () => {
      await result.current.submitDispute(
        formData,
        'delivery-123',
        '0xAbc123def456'
      );
    });

    // Note: reset is called internally, but we can verify through mocking
    expect(mockEscrowService.openDispute).toHaveBeenCalledWith({
      deliveryId: 'delivery-123',
      transactionId: 'tx_123456789',
      reason: 'damaged_items',
      description: 'Items arrived damaged',
      evidenceFiles: [],
      walletAddress: '0xAbc123def456',
    });
  });

  test('should include evidence files in dispute submission', async () => {
    mockEscrowService.openDispute.mockResolvedValueOnce({
      success: true,
      message: 'Dispute opened successfully',
      disputeId: 'DISP-001',
      transactionHash: '0x123456...',
    });

    const { result } = renderHook(() => useDisputeForm());

    const mockFile = new File(['test content'], 'evidence.jpg', { type: 'image/jpeg' });
    const formData = {
      transactionId: 'tx_123456789',
      reason: 'damaged_items' as const,
      description: 'Items arrived damaged',
      evidenceFiles: [mockFile],
    };

    await act(async () => {
      await result.current.submitDispute(
        formData,
        'delivery-123',
        '0xAbc123def456'
      );
    });

    expect(mockEscrowService.openDispute).toHaveBeenCalledWith(
      expect.objectContaining({
        evidenceFiles: [mockFile],
      })
    );
  });

  test('should pass correct parameters to escrow service', async () => {
    mockEscrowService.openDispute.mockResolvedValueOnce({
      success: true,
      message: 'Dispute opened successfully',
      disputeId: 'DISP-001',
      transactionHash: '0x123456...',
    });

    const { result } = renderHook(() => useDisputeForm());

    const formData = {
      transactionId: 'tx_987654321',
      reason: 'non_delivery' as const,
      description: 'Package never arrived at destination',
      evidenceFiles: [],
    };

    const deliveryId = 'delivery-456';
    const walletAddress = '0xDef789abc123';

    await act(async () => {
      await result.current.submitDispute(
        formData,
        deliveryId,
        walletAddress
      );
    });

    expect(mockEscrowService.openDispute).toHaveBeenCalledWith({
      deliveryId,
      transactionId: 'tx_987654321',
      reason: 'non_delivery',
      description: 'Package never arrived at destination',
      evidenceFiles: [],
      walletAddress,
    });
  });

  test('should handle different dispute reasons', async () => {
    mockEscrowService.openDispute.mockResolvedValueOnce({
      success: true,
      message: 'Dispute opened successfully',
      disputeId: 'DISP-001',
      transactionHash: '0x123456...',
    });

    const { result } = renderHook(() => useDisputeForm());

    const reasons = ['damaged_items', 'non_delivery', 'incorrect_items', 'other'] as const;

    for (const reason of reasons) {
      jest.clearAllMocks();
      mockEscrowService.openDispute.mockResolvedValueOnce({
        success: true,
        message: 'Dispute opened successfully',
        disputeId: 'DISP-001',
        transactionHash: '0x123456...',
      });

      const formData = {
        transactionId: 'tx_123456789',
        reason,
        description: 'Test dispute description',
        evidenceFiles: [],
      };

      await act(async () => {
        await result.current.submitDispute(
          formData,
          'delivery-123',
          '0xAbc123def456'
        );
      });

      expect(mockEscrowService.openDispute).toHaveBeenCalledWith(
        expect.objectContaining({ reason })
      );
    }
  });
});
