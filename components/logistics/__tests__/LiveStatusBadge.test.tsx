import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { LiveStatusBadge } from '@/components/logistics/LiveStatusBadge';
import { useLiveDeliveryStatus } from '@/hooks/useLiveDeliveryStatus';
import type { DeliveryStatus } from '@/services/deliverySocketService';

// ---------------------------------------------------------------------------
// Mock the hook layer — component tests must not depend on a live WebSocket.
// ---------------------------------------------------------------------------
jest.mock('@/hooks/useLiveDeliveryStatus');

const mockUseLiveDeliveryStatus = useLiveDeliveryStatus as jest.MockedFunction<
  typeof useLiveDeliveryStatus
>;

// Helper to configure the mock return value for each test
const mockStatus = (status: DeliveryStatus, isConnected = false) => {
  mockUseLiveDeliveryStatus.mockReturnValue({ status, isConnected });
};

// ---------------------------------------------------------------------------
// Fake timer helpers — needed to test the flash animation timeout
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('LiveStatusBadge', () => {
  const DELIVERY_ID = 'DEL-001';

  // -- Rendering -----------------------------------------------------------

  it('renders without crashing', () => {
    mockStatus('PENDING');
    render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('calls useLiveDeliveryStatus with the provided deliveryId', () => {
    mockStatus('PENDING');
    render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    expect(mockUseLiveDeliveryStatus).toHaveBeenCalledWith(DELIVERY_ID);
  });

  // -- Status labels -------------------------------------------------------

  it.each<[DeliveryStatus, string]>([
    ['PENDING', 'Pending'],
    ['ACCEPTED', 'Accepted'],
    ['IN_TRANSIT', 'In Transit'],
    ['DELIVERED', 'Delivered'],
    ['CANCELLED', 'Cancelled'],
    ['UNKNOWN', 'Unknown'],
  ])('displays human-readable label "%s" → "%s"', (status, expectedLabel) => {
    mockStatus(status);
    render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    expect(screen.getByRole('status')).toHaveTextContent(expectedLabel);
  });

  // -- Accessibility -------------------------------------------------------

  it('has role="status" for screen readers', () => {
    mockStatus('PENDING');
    render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    mockStatus('PENDING');
    render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('has a descriptive aria-label', () => {
    mockStatus('IN_TRANSIT');
    render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Delivery status: In Transit',
    );
  });

  // -- Pulse animation -----------------------------------------------------

  it('applies animate-pulse class when status is IN_TRANSIT', () => {
    mockStatus('IN_TRANSIT');
    render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    expect(screen.getByRole('status')).toHaveClass('animate-pulse');
  });

  it('does NOT apply animate-pulse for non-IN_TRANSIT statuses', () => {
    const nonTransitStatuses: DeliveryStatus[] = [
      'PENDING',
      'ACCEPTED',
      'DELIVERED',
      'CANCELLED',
      'UNKNOWN',
    ];

    nonTransitStatuses.forEach((status) => {
      mockStatus(status);
      const { unmount } = render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
      expect(screen.getByRole('status')).not.toHaveClass('animate-pulse');
      unmount();
    });
  });

  // -- Connection indicator ------------------------------------------------

  it('renders the connection indicator by default', () => {
    mockStatus('PENDING', false);
    render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    // The indicator is aria-hidden so we query by title attribute
    const indicator = document.querySelector('[title="Connecting…"]');
    expect(indicator).toBeInTheDocument();
  });

  it('shows "Live" title on the indicator when connected', () => {
    mockStatus('PENDING', true);
    render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    expect(document.querySelector('[title="Live"]')).toBeInTheDocument();
  });

  it('does not render the connection indicator when showConnectionIndicator=false', () => {
    mockStatus('PENDING', true);
    render(
      <LiveStatusBadge
        deliveryId={DELIVERY_ID}
        showConnectionIndicator={false}
      />,
    );
    expect(document.querySelector('[title="Live"]')).not.toBeInTheDocument();
    expect(
      document.querySelector('[title="Connecting…"]'),
    ).not.toBeInTheDocument();
  });

  // -- Status-specific colours (smoke tests) --------------------------------

  it('applies yellow background class for PENDING status', () => {
    mockStatus('PENDING');
    render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    expect(screen.getByRole('status').className).toMatch(/bg-yellow-100/);
  });

  it('applies blue background class for IN_TRANSIT status', () => {
    mockStatus('IN_TRANSIT');
    render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    expect(screen.getByRole('status').className).toMatch(/bg-blue-100/);
  });

  it('applies green background class for DELIVERED status', () => {
    mockStatus('DELIVERED');
    render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    expect(screen.getByRole('status').className).toMatch(/bg-green-100/);
  });

  it('applies red background class for CANCELLED status', () => {
    mockStatus('CANCELLED');
    render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    expect(screen.getByRole('status').className).toMatch(/bg-red-100/);
  });

  // -- Flash animation lifecycle -------------------------------------------

  it('applies ring flash classes immediately after a status update', () => {
    // Start with PENDING
    mockStatus('PENDING');
    const { rerender } = render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);

    // Transition to IN_TRANSIT — flash should trigger
    mockStatus('IN_TRANSIT');
    act(() => {
      rerender(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    });

    expect(screen.getByRole('status').className).toMatch(/ring-2/);
  });

  it('removes the ring flash after 1500 ms', () => {
    mockStatus('PENDING');
    const { rerender } = render(<LiveStatusBadge deliveryId={DELIVERY_ID} />);

    mockStatus('DELIVERED');
    act(() => {
      rerender(<LiveStatusBadge deliveryId={DELIVERY_ID} />);
    });

    // Advance past the 1500 ms timeout
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByRole('status').className).not.toMatch(/ring-2/);
  });
});
