import { render, screen, fireEvent } from '@testing-library/react';
import { PayoutUI } from '../PayoutUI';
import { useEscrowPayout } from '@/hooks/useEscrowPayout';

// Mock the useEscrowPayout hook
jest.mock('@/hooks/useEscrowPayout');
const mockedUseEscrowPayout = useEscrowPayout as jest.Mock;

describe('PayoutUI', () => {
  const mockEscrowId = 'escrow-123';
  const mockReleaseFunds = jest.fn();

  beforeEach(() => {
    // Reset mock before each test
    mockedUseEscrowPayout.mockClear();
    mockReleaseFunds.mockClear();
  });

  it('should render loading state', () => {
    mockedUseEscrowPayout.mockReturnValue({
      isLoading: true,
      error: null,
      requiredSignatures: 0,
      currentSignatures: 0,
      canRelease: false,
      releaseFunds: mockReleaseFunds,
    });

    render(<PayoutUI escrowId={mockEscrowId} />);
    expect(screen.getByLabelText('Loading payout UI')).toBeInTheDocument();
  });

  it('should render error state', () => {
    mockedUseEscrowPayout.mockReturnValue({
      isLoading: false,
      error: 'Failed to fetch escrow details',
      requiredSignatures: 0,
      currentSignatures: 0,
      canRelease: false,
      releaseFunds: mockReleaseFunds,
    });

    render(<PayoutUI escrowId={mockEscrowId} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Error: Failed to fetch escrow details',
    );
  });

  it('should disable the "Release Funds" button when signatures are below threshold (1 of 2)', () => {
    mockedUseEscrowPayout.mockReturnValue({
      isLoading: false,
      error: null,
      requiredSignatures: 2,
      currentSignatures: 1,
      canRelease: false,
      releaseFunds: mockReleaseFunds,
    });

    render(<PayoutUI escrowId={mockEscrowId} />);

    const releaseButton = screen.getByRole('button', { name: 'Release Funds' });
    expect(releaseButton).toBeDisabled();
    expect(screen.getByText('Signatures: 1 / 2')).toBeInTheDocument();

    // Assert that clicking the disabled button throws no exceptions and does not call releaseFunds
    fireEvent.click(releaseButton);
    expect(mockReleaseFunds).not.toHaveBeenCalled();
  });

  it('should enable the "Release Funds" button when signatures meet the threshold (2 of 2)', () => {
    mockedUseEscrowPayout.mockReturnValue({
      isLoading: false,
      error: null,
      requiredSignatures: 2,
      currentSignatures: 2,
      canRelease: true,
      releaseFunds: mockReleaseFunds,
    });

    render(<PayoutUI escrowId={mockEscrowId} />);

    const releaseButton = screen.getByRole('button', { name: 'Release Funds' });
    expect(releaseButton).not.toBeDisabled();
    expect(screen.getByText('Signatures: 2 / 2')).toBeInTheDocument();

    fireEvent.click(releaseButton);
    expect(mockReleaseFunds).toHaveBeenCalledTimes(1);
  });
});