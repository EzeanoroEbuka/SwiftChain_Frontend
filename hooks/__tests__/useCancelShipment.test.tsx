import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { toast } from 'sonner';
import { useCancelShipment } from '@/hooks/useCancelShipment';
import { shipmentService } from '@/services/shipmentService';

jest.mock('@/services/shipmentService', () => ({
  shipmentService: {
    getShipment: jest.fn(),
    cancelShipment: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
};

describe('useCancelShipment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns canCancel=true when shipment is pending and unassigned', async () => {
    (shipmentService.getShipment as jest.Mock).mockResolvedValue({
      id: 'ship-1',
      status: 'pending',
      driverId: null,
    });

    const { result } = renderHook(() => useCancelShipment('ship-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingShipment).toBe(false);
    });

    expect(result.current.canCancel).toBe(true);
  });

  it('returns canCancel=false when a driver has been assigned', async () => {
    (shipmentService.getShipment as jest.Mock).mockResolvedValue({
      id: 'ship-2',
      status: 'pending',
      driverId: 'driver-77',
    });

    const { result } = renderHook(() => useCancelShipment('ship-2'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingShipment).toBe(false);
    });

    expect(result.current.canCancel).toBe(false);
  });

  it('returns canCancel=false when shipment is no longer pending', async () => {
    (shipmentService.getShipment as jest.Mock).mockResolvedValue({
      id: 'ship-3',
      status: 'in_transit',
      driverId: null,
    });

    const { result } = renderHook(() => useCancelShipment('ship-3'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingShipment).toBe(false);
    });

    expect(result.current.canCancel).toBe(false);
  });

  it('calls shipmentService.cancelShipment and shows a success toast on cancel', async () => {
    (shipmentService.getShipment as jest.Mock).mockResolvedValue({
      id: 'ship-1',
      status: 'pending',
      driverId: null,
    });
    (shipmentService.cancelShipment as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Cancelled successfully',
    });

    const { result } = renderHook(() => useCancelShipment('ship-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.canCancel).toBe(true);
    });

    act(() => {
      result.current.cancel();
    });

    await waitFor(() => {
      expect(shipmentService.cancelShipment).toHaveBeenCalledWith('ship-1');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Cancelled successfully');
    });
  });

  it('shows an error toast when the cancellation API fails', async () => {
    (shipmentService.getShipment as jest.Mock).mockResolvedValue({
      id: 'ship-1',
      status: 'pending',
      driverId: null,
    });
    (shipmentService.cancelShipment as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Driver already assigned' } },
    });

    const { result } = renderHook(() => useCancelShipment('ship-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.canCancel).toBe(true);
    });

    act(() => {
      result.current.cancel();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Driver already assigned');
    });
  });
});
