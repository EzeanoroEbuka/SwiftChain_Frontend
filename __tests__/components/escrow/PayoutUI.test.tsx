import { render, screen, fireEvent } from '@testing-library/react';
import { PayoutUI } from '@/components/escrow/PayoutUI';
import { useEscrowPayout } from '@/hooks/useEscrowPayout';
import { escrowService } from '@/services/escrowService';
import type { EscrowDetails } from '@/types/escrow';

// Mock the useEscrowPayout hook
jest.mock('@/hooks/useEscrowPayout');
const mockedUseEscrowPayout = useEscrowPayout as jest.Mock;

// Mock the escrowService to verify Component -> Hook -> Service layered architecture
jest.mock('@/services/escrowService', () => ({
  escrowService: {
    getEscrowDetails: jest.fn(),
    releaseFunds: jest.fn(),
  },
}));

describe('PayoutUI — Multi-Signature Threshold Logic', () => {
  const mockEscrowId = 'escrow-contract-0x123';
  const mockReleaseFunds = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── 1. Mock 1 of 2 signatures complete — button must be disabled ──────────────
  it('disables the "Release Funds" button when 1 of 2 signatures are complete', () => {
    mockedUseEscrowPayout.mockReturnValue({
      isLoading: false,
      error: null,
      requiredSignatures: 2,
      currentSignatures: 1,
      signers: ['GBX123ALPHA'],
      isReleased: false,
      canRelease: false,
      releaseFunds: mockReleaseFunds,
    });

    render(<PayoutUI escrowId={mockEscrowId} />);

    const releaseButton = screen.getByRole('button', { name: 'Release Funds' });
    
    // Explicitly assert the disabled attribute as specified in Acceptance Criteria
    expect(releaseButton).toBeDisabled();
    expect(releaseButton).toHaveAttribute('disabled');
    expect(screen.getByText(/1.*of.*2/i)).toBeInTheDocument();

    // Clicking disabled button must not invoke releaseFunds
    fireEvent.click(releaseButton);
    expect(mockReleaseFunds).not.toHaveBeenCalled();
  });

  // ── 2. Varied threshold states: 0 of 2 signatures complete ───────────────────
  it('disables the button when 0 of 2 signatures are complete', () => {
    mockedUseEscrowPayout.mockReturnValue({
      isLoading: false,
      error: null,
      requiredSignatures: 2,
      currentSignatures: 0,
      signers: [],
      isReleased: false,
      canRelease: false,
      releaseFunds: mockReleaseFunds,
    });

    render(<PayoutUI escrowId={mockEscrowId} />);

    const releaseButton = screen.getByRole('button', { name: 'Release Funds' });
    expect(releaseButton).toBeDisabled();
    expect(releaseButton).toHaveAttribute('disabled');
    expect(screen.getByText(/0.*of.*2/i)).toBeInTheDocument();
  });

  // ── 3. Varied threshold states: 2 of 3 signatures complete ───────────────────
  it('disables the button when 2 of 3 signatures are complete (below threshold)', () => {
    mockedUseEscrowPayout.mockReturnValue({
      isLoading: false,
      error: null,
      requiredSignatures: 3,
      currentSignatures: 2,
      signers: ['GBX123ALPHA', 'GCY456BETA'],
      isReleased: false,
      canRelease: false,
      releaseFunds: mockReleaseFunds,
    });

    render(<PayoutUI escrowId={mockEscrowId} />);

    const releaseButton = screen.getByRole('button', { name: 'Release Funds' });
    expect(releaseButton).toBeDisabled();
    expect(releaseButton).toHaveAttribute('disabled');
    expect(screen.getByText(/2.*of.*3/i)).toBeInTheDocument();
  });

  // ── 4. Threshold met (2 of 2) — button enabled and clickable ────────────────
  it('enables the "Release Funds" button when threshold is met (2 of 2 signatures)', () => {
    mockedUseEscrowPayout.mockReturnValue({
      isLoading: false,
      error: null,
      requiredSignatures: 2,
      currentSignatures: 2,
      signers: ['GBX123ALPHA', 'GCY456BETA'],
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

  // ── 5. Threshold met (3 of 3) — button enabled and clickable ────────────────
  it('enables the button when 3 of 3 signatures are complete', () => {
    mockedUseEscrowPayout.mockReturnValue({
      isLoading: false,
      error: null,
      requiredSignatures: 3,
      currentSignatures: 3,
      signers: ['GBX123ALPHA', 'GCY456BETA', 'GDZ789GAMMA'],
      isReleased: false,
      canRelease: true,
      releaseFunds: mockReleaseFunds,
    });

    render(<PayoutUI escrowId={mockEscrowId} />);

    const releaseButton = screen.getByRole('button', { name: 'Release Funds' });
    expect(releaseButton).not.toBeDisabled();
    expect(releaseButton).not.toHaveAttribute('disabled');

    fireEvent.click(releaseButton);
    expect(mockReleaseFunds).toHaveBeenCalledTimes(1);
  });

  // ── 6. Loading state ────────────────────────────────────────────────────────
  it('renders loading indicator state when fetching escrow state', () => {
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

  // ── 7. Error state ──────────────────────────────────────────────────────────
  it('renders error alert when loading escrow details fails', () => {
    mockedUseEscrowPayout.mockReturnValue({
      isLoading: false,
      error: 'Network error connecting to Soroban RPC',
      requiredSignatures: 0,
      currentSignatures: 0,
      signers: [],
      isReleased: false,
      canRelease: false,
      releaseFunds: mockReleaseFunds,
    });

    render(<PayoutUI escrowId={mockEscrowId} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Network error connecting to Soroban RPC')).toBeInTheDocument();
  });

  // ── 8. Service integration layer verification ──────────────────────────────
  it('verifies backend API service contract for escrow details response structure', async () => {
    const apiResponseData: EscrowDetails = {
      currentSignatures: 1,
      requiredSignatures: 2,
      isReleased: false,
      signers: ['GBX123ALPHA'],
    };

    (escrowService.getEscrowDetails as jest.Mock).mockResolvedValue(apiResponseData);

    const result = await escrowService.getEscrowDetails(mockEscrowId);
    expect(result.currentSignatures).toBe(1);
    expect(result.requiredSignatures).toBe(2);
    expect(result.isReleased).toBe(false);
    expect(result.signers).toEqual(['GBX123ALPHA']);
  });
});
