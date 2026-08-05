import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHandoffQR, useGenerateHandoffQR, useVerifyHandoffQR } from '../hooks/useHandoffQR';
import * as shipmentHandoffService from '../services/shipmentHandoffService';

// Mock the service
jest.mock('../services/shipmentHandoffService');
jest.mock('../hooks/useToast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

const mockHandoffQRData = {
  qrData: 'https://example.com/qr/token123',
  expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  deliveryId: 'del-123',
  token: 'token123',
};

const mockQRHandoffToken = {
  id: 'token-id-123',
  deliveryId: 'del-123',
  token: 'token123',
  expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  verifiedAt: new Date().toISOString(),
};

// Create a custom render function with QueryClient provider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useHandoffQR Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch handoff QR data successfully', async () => {
    const mockGetHandoffQR = jest.spyOn(shipmentHandoffService.shipmentHandoffService, 'getHandoffQR')
      .mockResolvedValue(mockHandoffQRData);

    const { result } = renderHook(() => useHandoffQR('del-123'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockHandoffQRData);
    expect(mockGetHandoffQR).toHaveBeenCalledWith('del-123');
  });

  it('should handle error when fetching QR data fails', async () => {
    const mockError = new Error('Network error');
    jest.spyOn(shipmentHandoffService.shipmentHandoffService, 'getHandoffQR')
      .mockRejectedValue(mockError);

    const { result } = renderHook(() => useHandoffQR('del-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('should not fetch when enabled is false', () => {
    const mockGetHandoffQR = jest.spyOn(shipmentHandoffService.shipmentHandoffService, 'getHandoffQR')
      .mockResolvedValue(mockHandoffQRData);

    renderHook(() => useHandoffQR('del-123', false), {
      wrapper: createWrapper(),
    });

    expect(mockGetHandoffQR).not.toHaveBeenCalled();
  });

  it('should not fetch when deliveryId is empty', () => {
    const mockGetHandoffQR = jest.spyOn(shipmentHandoffService.shipmentHandoffService, 'getHandoffQR')
      .mockResolvedValue(mockHandoffQRData);

    renderHook(() => useHandoffQR(''), {
      wrapper: createWrapper(),
    });

    expect(mockGetHandoffQR).not.toHaveBeenCalled();
  });
});

describe('useGenerateHandoffQR Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate handoff QR successfully', async () => {
    const mockGenerateHandoffQR = jest.spyOn(shipmentHandoffService.shipmentHandoffService, 'generateHandoffQR')
      .mockResolvedValue(mockHandoffQRData);

    const { result } = renderHook(() => useGenerateHandoffQR(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('del-123');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGenerateHandoffQR).toHaveBeenCalledWith('del-123');
    expect(result.current.data).toEqual(mockHandoffQRData);
  });

  it('should handle error when generation fails', async () => {
    const mockError = new Error('Generation failed');
    jest.spyOn(shipmentHandoffService.shipmentHandoffService, 'generateHandoffQR')
      .mockRejectedValue(mockError);

    const { result } = renderHook(() => useGenerateHandoffQR(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('del-123');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});

describe('useVerifyHandoffQR Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify handoff QR successfully', async () => {
    const mockVerifyHandoffQR = jest.spyOn(shipmentHandoffService.shipmentHandoffService, 'verifyHandoffQR')
      .mockResolvedValue(mockQRHandoffToken);

    const { result } = renderHook(() => useVerifyHandoffQR(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      deliveryId: 'del-123',
      token: 'token123',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockVerifyHandoffQR).toHaveBeenCalledWith('del-123', 'token123');
    expect(result.current.data).toEqual(mockQRHandoffToken);
  });

  it('should handle error when verification fails', async () => {
    const mockError = new Error('Verification failed');
    jest.spyOn(shipmentHandoffService.shipmentHandoffService, 'verifyHandoffQR')
      .mockRejectedValue(mockError);

    const { result } = renderHook(() => useVerifyHandoffQR(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      deliveryId: 'del-123',
      token: 'invalid-token',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});
