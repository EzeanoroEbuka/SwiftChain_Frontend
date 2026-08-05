import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DisputeForm from '@/components/escrow/DisputeForm';
import * as escrowServiceModule from '@/services/escrowService';

// Mock the useDisputeForm hook
jest.mock('@/hooks/useDisputeForm', () => ({
  useDisputeForm: () => ({
    register: jest.fn((name) => ({
      name,
      ref: jest.fn(),
    })),
    handleSubmit: (onSubmit: any) => (e: React.FormEvent) => {
      e.preventDefault();
      return onSubmit({
        transactionId: 'tx_123456789',
        reason: 'damaged_items',
        description: 'Items arrived damaged',
        evidenceFiles: [],
      });
    },
    formState: {
      errors: {},
      isSubmitting: false,
    },
    watch: (field: string) => {
      const values: Record<string, any> = {
        transactionId: 'tx_123456789',
        reason: 'damaged_items',
        description: 'Items arrived damaged',
      };
      return values[field];
    },
    setValue: jest.fn(),
    reset: jest.fn(),
    submitDispute: jest.fn(async (formData, deliveryId, walletAddress, onSuccess) => {
      onSuccess({
        success: true,
        message: 'Dispute opened successfully',
        disputeId: 'DISP-001',
        transactionHash: '0x123456...',
      });
    }),
  }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => children;
});

describe('DisputeForm Component', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  const defaultProps = {
    deliveryId: 'delivery-123',
    walletAddress: '0xAbc123def456',
    onSuccess: mockOnSuccess,
    onError: mockOnError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render the initial dispute reason step', () => {
    render(<DisputeForm {...defaultProps} />);

    expect(
      screen.getByRole('heading', { name: /Open a Dispute/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Transaction ID/)).toBeInTheDocument();
    expect(screen.getByText(/Items Damaged/)).toBeInTheDocument();
    expect(screen.getByText(/Description/)).toBeInTheDocument();
  });

  test('should display all dispute reason options', () => {
    render(<DisputeForm {...defaultProps} />);

    expect(screen.getByText('Items Damaged')).toBeInTheDocument();
    expect(screen.getByText('Non-Delivery')).toBeInTheDocument();
    expect(screen.getByText('Incorrect Items')).toBeInTheDocument();
    expect(screen.getByText('Other Issue')).toBeInTheDocument();
  });

  test('should have Continue button to proceed to evidence step', () => {
    render(<DisputeForm {...defaultProps} />);

    const continueButton = screen.getByRole('button', {
      name: /Continue to Evidence/,
    });
    expect(continueButton).toBeInTheDocument();
  });

  test('should have Cancel button to close form', () => {
    render(<DisputeForm {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/ });
    expect(cancelButton).toBeInTheDocument();
  });

  test('should display file upload area in evidence step', async () => {
    render(<DisputeForm {...defaultProps} />);

    // First, move to evidence step
    const continueButton = screen.getByRole('button', {
      name: /Continue to Evidence/,
    });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 3/)).toBeInTheDocument();
      expect(screen.getByText(/Upload Evidence/)).toBeInTheDocument();
      expect(screen.getByText(/Click to upload or drag and drop/)).toBeInTheDocument();
    });
  });

  test('should display file upload information text', async () => {
    render(<DisputeForm {...defaultProps} />);

    const continueButton = screen.getByRole('button', {
      name: /Continue to Evidence/,
    });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Images or PDF.*max 10MB per file/i)
      ).toBeInTheDocument();
    });
  });

  test('should have Review & Confirm button on evidence step', async () => {
    render(<DisputeForm {...defaultProps} />);

    const continueButton = screen.getByRole('button', {
      name: /Continue to Evidence/,
    });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Review & Confirm/ })
      ).toBeInTheDocument();
    });
  });

  test('should have Back button to return to dispute reason step', async () => {
    render(<DisputeForm {...defaultProps} />);

    const continueButton = screen.getByRole('button', {
      name: /Continue to Evidence/,
    });
    fireEvent.click(continueButton);

    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /Back/ });
      expect(backButton).toBeInTheDocument();
    });
  });

  test('should show confirmation dialog with warning message', async () => {
    render(<DisputeForm {...defaultProps} />);

    const continueButton = screen.getByRole('button', {
      name: /Continue to Evidence/,
    });
    fireEvent.click(continueButton);

    // Wait for evidence step and then click Review & Confirm
    const reviewButton = await screen.findByRole('button', {
      name: /Review & Confirm/,
    });
    fireEvent.click(reviewButton);

    // Check that confirmation dialog appears with the expected warning message
    await waitFor(() => {
      expect(
        screen.getByText(/Your funds will be locked in escrow during arbitration/)
      ).toBeInTheDocument();
    });
  });

  test('should display warning about frozen funds in confirmation', async () => {
    render(<DisputeForm {...defaultProps} />);

    const continueButton = screen.getByRole('button', {
      name: /Continue to Evidence/,
    });
    fireEvent.click(continueButton);

    const reviewButton = await screen.findByRole('button', {
      name: /Review & Confirm/,
    });
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(
        screen.getByText(/funds will be locked in escrow during arbitration/)
      ).toBeInTheDocument();
    });
  });

  test('should show success screen after confirmation', async () => {
    render(<DisputeForm {...defaultProps} />);

    const continueButton = screen.getByRole('button', {
      name: /Continue to Evidence/,
    });
    fireEvent.click(continueButton);

    const reviewButton = await screen.findByRole('button', {
      name: /Review & Confirm/,
    });
    fireEvent.click(reviewButton);

    const confirmButton = await screen.findByRole('button', {
      name: /Confirm Dispute/,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Dispute Submitted/)).toBeInTheDocument();
      expect(
        screen.getByText(/successfully opened/)
      ).toBeInTheDocument();
    });
  });

  test('should display dispute ID in success view', async () => {
    render(<DisputeForm {...defaultProps} />);

    const continueButton = screen.getByRole('button', {
      name: /Continue to Evidence/,
    });
    fireEvent.click(continueButton);

    const reviewButton = await screen.findByRole('button', {
      name: /Review & Confirm/,
    });
    fireEvent.click(reviewButton);

    const confirmButton = await screen.findByRole('button', {
      name: /Confirm Dispute/,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Dispute ID:/)).toBeInTheDocument();
      expect(screen.getByText(/DISP-001/)).toBeInTheDocument();
    });
  });

  test('should call onSuccess callback after successful dispute submission', async () => {
    render(<DisputeForm {...defaultProps} />);

    const continueButton = screen.getByRole('button', {
      name: /Continue to Evidence/,
    });
    fireEvent.click(continueButton);

    const reviewButton = await screen.findByRole('button', {
      name: /Review & Confirm/,
    });
    fireEvent.click(reviewButton);

    const confirmButton = await screen.findByRole('button', {
      name: /Confirm Dispute/,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('should render all three dispute reason radio buttons', () => {
    render(<DisputeForm {...defaultProps} />);

    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons.length).toBeGreaterThanOrEqual(3);
  });

  test('should have required field indicators', () => {
    render(<DisputeForm {...defaultProps} />);

    const requiredIndicators = screen.getAllByText('*');
    expect(requiredIndicators.length).toBeGreaterThan(0);
  });

  test('should display character count in description field', () => {
    render(<DisputeForm {...defaultProps} />);

    expect(screen.getByText(/\/500/)).toBeInTheDocument();
  });

  test('should show Choose Files button for evidence upload', async () => {
    render(<DisputeForm {...defaultProps} />);

    const continueButton = screen.getByRole('button', {
      name: /Continue to Evidence/,
    });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Choose Files/ })
      ).toBeInTheDocument();
    });
  });
});
