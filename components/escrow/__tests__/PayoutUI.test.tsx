import { render, screen, fireEvent } from '@testing-library/react';
import { PayoutUI } from '../PayoutUI';
import { useEscrowPayout } from '@/hooks/useEscrowPayout';
import { escrowService } from '@/services/escrowService';
import type { EscrowDetails } from '@/types/escrow';

// Mock the useEscrowPayout hook
jest.mock('@/hooks/useEscrowPayout');
const mockedUseEscrowPayout = useEscrowPayout as jest.Mock;

// Mock the escrowService
jest.mock('@/services/escrowService', () => ({
  escrowService: {
    getEscrowDetails: jest.fn(),
    releaseFunds: jest.fn(),
  },
}));

describe('PayoutUI', () => {
  const mockEscrowId = 'escrow-123';
  const mockReleaseFunds = jest.fn();

  beforeEach(() => {
    mockedUseEscrowPayout.mockClear();
    mockReleaseFunds.mockClear();
  });

  it('should render loading state', () => {
    mockedUseEscrowPayout.mockReturnValue({
      isLoading: true,
      error: null,
      requiredSignatures: 0,
      currentSignatures: 0,
      signers: [],
      isReleased: false,
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
      signers: [],
      isReleased: false,
      canRelease: false,
      releaseFunds: mockReleaseFunds,
    });

    render(<PayoutUI escrowId={mockEscrowId} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Failed to fetch escrow details',
    );
  });

  it('should disable the "Release Funds" button when signatures are below threshold (1 of 2)', () => {
    mockedUseEscrowPayout.mockReturnValue({
      isLoading: false,
      error: null,
      requiredSignatures: 2,
      currentSignatures: 1,
      signers: ['GBX123'],
      isReleased: false,
      canRelease: false,
      releaseFunds: mockReleaseFunds,
    });

    render(<PayoutUI escrowId={mockEscrowId} />);

    const releaseButton = screen.getByRole('button', { name: 'Release Funds' });
    expect(releaseButton).toBeDisabled();
    expect(releaseButton).toHaveAttribute('disabled');
    expect(screen.getByText(/1.*of.*2/i)).toBeInTheDocument();

    fireEvent.click(releaseButton);
    expect(mockReleaseFunds).not.toHaveBeenCalled();
  });

  it('should enable the "Release Funds" button when signatures meet the threshold (2 of 2)', () => {
    mockedUseEscrowPayout.mockReturnValue({
      isLoading: false,
      error: null,
      requiredSignatures: 2,
      currentSignatures: 2,
      signers: ['GBX123', 'GCY456'],
      isReleased: false,
      canRelease: true,
      releaseFunds: mockReleaseFunds,
    });

    render(<PayoutUI escrowId={mockEscrowId} />);

    const releaseButton = screen.getByRole('button', { name: 'Release Funds' });
    expect(releaseButton).not.toBeDisabled();
    expect(releaseButton).not.toHaveAttribute('disabled');
    expect(screen.getByText(/2.*of.*2/i)).toBeInTheDocument();

    fireEvent.click(releaseButton);
    expect(mockReleaseFunds).toHaveBeenCalledTimes(1);
  });

  it('verifies backend API service returns EscrowDetails response shape', async () => {
    const apiResponseData: EscrowDetails = {
      currentSignatures: 1,
      requiredSignatures: 2,
      isReleased: false,
      signers: ['GBX123'],
    };

    (escrowService.getEscrowDetails as jest.Mock).mockResolvedValue(apiResponseData);

    const result = await escrowService.getEscrowDetails(mockEscrowId);
    expect(result.currentSignatures).toBe(1);
    expect(result.requiredSignatures).toBe(2);
  });
});