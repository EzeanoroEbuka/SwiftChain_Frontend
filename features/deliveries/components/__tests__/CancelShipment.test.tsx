import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CancelShipment } from '@/features/deliveries/components/CancelShipment';
import { shipmentService } from '@/services/shipmentService';

jest.mock('@/services/shipmentService', () => ({
  shipmentService: {
    getShipment: jest.fn(),
    cancelShipment: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('CancelShipment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Cancel Request button when shipment is pending and unassigned', async () => {
    (shipmentService.getShipment as jest.Mock).mockResolvedValue({
      id: 'ship-1',
      status: 'pending',
      driverId: null,
    });

    renderWithClient(<CancelShipment shipmentId="ship-1" />);

    expect(
      await screen.findByTestId('cancel-request-button')
    ).toBeInTheDocument();
  });

  it('does NOT render the Cancel Request button when a driver is assigned', async () => {
    (shipmentService.getShipment as jest.Mock).mockResolvedValue({
      id: 'ship-2',
      status: 'pending',
      driverId: 'driver-99',
    });

    renderWithClient(<CancelShipment shipmentId="ship-2" />);

    // Wait for the loading state to clear before asserting absence.
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    expect(
      screen.queryByTestId('cancel-request-button')
    ).not.toBeInTheDocument();
  });

  it('does NOT render the Cancel Request button once the shipment is in transit', async () => {
    (shipmentService.getShipment as jest.Mock).mockResolvedValue({
      id: 'ship-3',
      status: 'in_transit',
      driverId: 'driver-1',
    });

    renderWithClient(<CancelShipment shipmentId="ship-3" />);

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    expect(
      screen.queryByTestId('cancel-request-button')
    ).not.toBeInTheDocument();
  });

  it('opens a confirmation modal warning about escrow refund timing', async () => {
    (shipmentService.getShipment as jest.Mock).mockResolvedValue({
      id: 'ship-1',
      status: 'pending',
      driverId: null,
    });

    renderWithClient(<CancelShipment shipmentId="ship-1" />);

    fireEvent.click(await screen.findByTestId('cancel-request-button'));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/escrow refund timing/i);
    expect(dialog).toHaveTextContent(/few minutes/i);
  });

  it('dispatches cancellation only after the user confirms in the modal', async () => {
    (shipmentService.getShipment as jest.Mock).mockResolvedValue({
      id: 'ship-1',
      status: 'pending',
      driverId: null,
    });
    (shipmentService.cancelShipment as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Cancelled',
    });

    renderWithClient(<CancelShipment shipmentId="ship-1" />);

    fireEvent.click(await screen.findByTestId('cancel-request-button'));

    // Dismissing should NOT call the service.
    fireEvent.click(screen.getByTestId('cancel-modal-dismiss'));
    expect(shipmentService.cancelShipment).not.toHaveBeenCalled();

    // Re-open and confirm.
    fireEvent.click(screen.getByTestId('cancel-request-button'));
    fireEvent.click(screen.getByTestId('cancel-modal-confirm'));

    await waitFor(() => {
      expect(shipmentService.cancelShipment).toHaveBeenCalledWith('ship-1');
    });
  });
});
