import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeliveryList } from '@/components/DeliveryList';
import { useDeliveries } from '@/hooks/useDeliveries';
import { Delivery } from '@/types/delivery';

// Mock the useDeliveries hook
jest.mock('@/hooks/useDeliveries');

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockUseDeliveries = useDeliveries as jest.MockedFunction<
  typeof useDeliveries
>;

const mockDeliveries: Delivery[] = [
  {
    id: 'delivery-1',
    trackingNumber: 'TRACK-001',
    senderId: 'sender-1',
    driverId: 'driver-1',
    driver: {
      id: 'driver-1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1111111111',
      rating: 4.8,
    },
    status: 'IN_TRANSIT',
    origin: 'New York, NY',
    destination: 'Boston, MA',
    landmark: 'Near the central market',
    escrowStatus: 'LOCKED',
    amount: 100,
    currency: 'USD',
    createdAt: '2026-05-28T08:00:00Z',
    updatedAt: '2026-05-28T14:00:00Z',
  },
  {
    id: 'delivery-2',
    trackingNumber: 'TRACK-002',
    senderId: 'sender-2',
    status: 'PENDING',
    origin: 'Chicago, IL',
    destination: 'Detroit, MI',
    escrowStatus: 'NOT_LOCKED',
    amount: 150,
    currency: 'USD',
    createdAt: '2026-05-28T09:00:00Z',
    updatedAt: '2026-05-28T09:00:00Z',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('DeliveryList', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    mockUseDeliveries.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isFetching: false,
      status: 'pending',
      fetchStatus: 'idle',
      refetch: jest.fn(),
      isPending: true,
      isPaused: false,
      isError: false,
      isSuccess: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
    } as any);

    render(<DeliveryList />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading deliveries...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    const mockError = new Error('Failed to fetch deliveries');
    mockUseDeliveries.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      isFetching: false,
      status: 'error',
      fetchStatus: 'idle',
      refetch: jest.fn(),
      isPending: false,
      isPaused: false,
      isError: true,
      isSuccess: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 1,
      failureReason: mockError,
    } as any);

    render(<DeliveryList />, { wrapper: createWrapper() });

    expect(screen.getByText(/Error fetching deliveries/)).toBeInTheDocument();
  });

  it('should display "No deliveries found" when data is empty', () => {
    mockUseDeliveries.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isFetching: false,
      status: 'success',
      fetchStatus: 'idle',
      refetch: jest.fn(),
      isPending: false,
      isPaused: false,
      isError: false,
      isSuccess: true,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
    } as any);

    render(<DeliveryList />, { wrapper: createWrapper() });

    expect(screen.getByText('No deliveries found.')).toBeInTheDocument();
  });

  it('should display list of deliveries', () => {
    mockUseDeliveries.mockReturnValue({
      data: mockDeliveries,
      isLoading: false,
      error: null,
      isFetching: false,
      status: 'success',
      fetchStatus: 'idle',
      refetch: jest.fn(),
      isPending: false,
      isPaused: false,
      isError: false,
      isSuccess: true,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
    } as any);

    render(<DeliveryList />, { wrapper: createWrapper() });

    expect(screen.getByText('TRACK-001')).toBeInTheDocument();
    expect(screen.getByText('TRACK-002')).toBeInTheDocument();
  });

  it('should render all delivery tracking numbers', () => {
    mockUseDeliveries.mockReturnValue({
      data: mockDeliveries,
      isLoading: false,
      error: null,
      isFetching: false,
      status: 'success',
      fetchStatus: 'idle',
      refetch: jest.fn(),
      isPending: false,
      isPaused: false,
      isError: false,
      isSuccess: true,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
    } as any);

    render(<DeliveryList />, { wrapper: createWrapper() });

    mockDeliveries.forEach((delivery) => {
      expect(screen.getByText(delivery.trackingNumber)).toBeInTheDocument();
    });
  });

  it('should render an optional landmark for deliveries', () => {
    mockUseDeliveries.mockReturnValue({
      data: mockDeliveries,
      isLoading: false,
      error: null,
      isFetching: false,
      status: 'success',
      fetchStatus: 'idle',
      refetch: jest.fn(),
      isPending: false,
      isPaused: false,
      isError: false,
      isSuccess: true,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
    } as any);

    render(<DeliveryList />, { wrapper: createWrapper() });

    expect(screen.getByText(/Near the central market/i)).toBeInTheDocument();
  });

  it('should display correct header text', () => {
    mockUseDeliveries.mockReturnValue({
      data: mockDeliveries,
      isLoading: false,
      error: null,
      isFetching: false,
      status: 'success',
      fetchStatus: 'idle',
      refetch: jest.fn(),
      isPending: false,
      isPaused: false,
      isError: false,
      isSuccess: true,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
    } as any);

    render(<DeliveryList />, { wrapper: createWrapper() });

    expect(screen.getByText('Active Deliveries')).toBeInTheDocument();
  });

  it('should render status and escrow information for each delivery', () => {
    mockUseDeliveries.mockReturnValue({
      data: mockDeliveries,
      isLoading: false,
      error: null,
      isFetching: false,
      status: 'success',
      fetchStatus: 'idle',
      refetch: jest.fn(),
      isPending: false,
      isPaused: false,
      isError: false,
      isSuccess: true,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
    } as any);

    render(<DeliveryList />, { wrapper: createWrapper() });

    expect(screen.getByText('IN_TRANSIT', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('PENDING', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getAllByText(/Escrow:/).length).toBeGreaterThan(0);
  });

  it('should render core delivery metadata without extra interaction', () => {
    mockUseDeliveries.mockReturnValue({
      data: mockDeliveries,
      isLoading: false,
      error: null,
      isFetching: false,
      status: 'success',
      fetchStatus: 'idle',
      refetch: jest.fn(),
      isPending: false,
      isPaused: false,
      isError: false,
      isSuccess: true,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
    } as any);

    render(<DeliveryList />, { wrapper: createWrapper() });

    expect(screen.getByText('New York, NY ➔ Boston, MA')).toBeInTheDocument();
    expect(screen.getByText('Chicago, IL ➔ Detroit, MI')).toBeInTheDocument();
  });
});
