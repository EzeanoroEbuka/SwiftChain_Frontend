import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EscrowLock } from '@/features/escrow/components';
import { useEscrowLock } from '@/hooks/useEscrowLock';
import { useToast } from '@/hooks/useToast';

jest.mock('@/hooks/useEscrowLock');
jest.mock('@/hooks/useToast');

describe('EscrowLock', () => {
  const mockEscrowLock = useEscrowLock as jest.MockedFunction<typeof useEscrowLock>;
  const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast } as any);
    mockEscrowLock.mockReturnValue({
      isLoading: false,
      error: null,
      escrowId: null,
      transactionHash: null,
      lockEscrow: jest.fn().mockResolvedValue({
        escrowId: 'escrow-123',
        transactionHash: '0xabc123',
      }),
      reset: jest.fn(),
    } as any);
  });

  it('displays the total cost in large format', () => {
    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress="0x123...789"
      />
    );

    expect(screen.getByText('100.50 USDC')).toBeInTheDocument();
  });

  it('shows wallet connection warning when no wallet', () => {
    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress={undefined}
      />
    );

    expect(
      screen.getByText('⚠️ Connect your wallet to lock this payment')
    ).toBeInTheDocument();
  });

  it('disables button when wallet not connected', () => {
    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress={undefined}
      />
    );

    const button = screen.getByRole('button', { name: /Lock Payment in Escrow/i });
    expect(button).toBeDisabled();
  });

  it('shows spinner during loading state', () => {
    mockEscrowLock.mockReturnValue({
      isLoading: true,
      error: null,
      escrowId: null,
      transactionHash: null,
      lockEscrow: jest.fn(),
      reset: jest.fn(),
    } as any);

    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress="0x123...789"
      />
    );

    expect(screen.getByText('Locking Payment…')).toBeInTheDocument();
  });

  it('opens confirmation modal when lock button clicked', async () => {
    const user = userEvent.setup();
    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress="0x123...789"
      />
    );

    const button = screen.getByRole('button', { name: /Lock Payment in Escrow/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Confirm Escrow Lock')).toBeInTheDocument();
    });
  });

  it('shows amount in confirmation modal', async () => {
    const user = userEvent.setup();
    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress="0x123...789"
      />
    );

    const button = screen.getByRole('button', { name: /Lock Payment in Escrow/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('100.50 USDC')).toBeInTheDocument();
    });
  });

  it('cancels confirmation and closes modal', async () => {
    const user = userEvent.setup();
    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress="0x123...789"
      />
    );

    const lockButton = screen.getByRole('button', { name: /Lock Payment in Escrow/i });
    await user.click(lockButton);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Confirm Escrow Lock')).not.toBeInTheDocument();
    });
  });

  it('calls lockEscrow service when confirmed', async () => {
    const user = userEvent.setup();
    const mockLockEscrow = jest.fn().mockResolvedValue({
      escrowId: 'escrow-123',
      transactionHash: '0xabc123',
    });

    mockEscrowLock.mockReturnValue({
      isLoading: false,
      error: null,
      escrowId: 'escrow-123',
      transactionHash: '0xabc123',
      lockEscrow: mockLockEscrow,
      reset: jest.fn(),
    } as any);

    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress="0x123...789"
      />
    );

    const lockButton = screen.getByRole('button', { name: /Lock Payment in Escrow/i });
    await user.click(lockButton);

    const confirmButton = screen.getByRole('button', { name: /Confirm Lock/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockLockEscrow).toHaveBeenCalledWith({
        deliveryId: 'delivery-1',
        amount: 100.5,
        currency: 'USDC',
        walletAddress: '0x123...789',
      });
    });
  });

  it('displays success state with transaction hash', () => {
    mockEscrowLock.mockReturnValue({
      isLoading: false,
      error: null,
      escrowId: 'escrow-123',
      transactionHash: '0xabc123def456789',
      lockEscrow: jest.fn(),
      reset: jest.fn(),
    } as any);

    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress="0x123...789"
      />
    );

    expect(screen.getByText('Payment Locked Successfully!')).toBeInTheDocument();
    expect(screen.getByText('0xabc123def456789')).toBeInTheDocument();
  });

  it('displays error state with message', () => {
    mockEscrowLock.mockReturnValue({
      isLoading: false,
      error: 'Insufficient funds in wallet',
      escrowId: null,
      transactionHash: null,
      lockEscrow: jest.fn(),
      reset: jest.fn(),
    } as any);

    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress="0x123...789"
      />
    );

    expect(screen.getByText('Error Locking Payment')).toBeInTheDocument();
    expect(screen.getByText('Insufficient funds in wallet')).toBeInTheDocument();
  });

  it('calls onSuccess callback with escrowId and transactionHash', async () => {
    const mockOnSuccess = jest.fn();
    const mockLockEscrow = jest.fn().mockResolvedValue({
      escrowId: 'escrow-123',
      transactionHash: '0xabc123',
    });

    mockEscrowLock.mockReturnValue({
      isLoading: false,
      error: null,
      escrowId: 'escrow-123',
      transactionHash: '0xabc123',
      lockEscrow: mockLockEscrow,
      reset: jest.fn(),
    } as any);

    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress="0x123...789"
        onSuccess={mockOnSuccess}
      />
    );

    expect(mockOnSuccess).toHaveBeenCalledWith('escrow-123', '0xabc123');
  });

  it('calls onError callback with error message', () => {
    const mockOnError = jest.fn();
    mockEscrowLock.mockReturnValue({
      isLoading: false,
      error: 'Failed to lock escrow',
      escrowId: null,
      transactionHash: null,
      lockEscrow: jest.fn(),
      reset: jest.fn(),
    } as any);

    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress="0x123...789"
        onError={mockOnError}
      />
    );

    expect(mockOnError).toHaveBeenCalledWith('Failed to lock escrow');
  });

  it('shows reset button in success state', () => {
    mockEscrowLock.mockReturnValue({
      isLoading: false,
      error: null,
      escrowId: 'escrow-123',
      transactionHash: '0xabc123',
      lockEscrow: jest.fn(),
      reset: jest.fn(),
    } as any);

    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress="0x123...789"
      />
    );

    expect(screen.getByRole('button', { name: /Lock Another Delivery/i })).toBeInTheDocument();
  });

  it('shows try again button in error state', () => {
    mockEscrowLock.mockReturnValue({
      isLoading: false,
      error: 'Failed',
      escrowId: null,
      transactionHash: null,
      lockEscrow: jest.fn(),
      reset: jest.fn(),
    } as any);

    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress="0x123...789"
      />
    );

    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('shows wallet status when disconnected', () => {
    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress={undefined}
      />
    );

    expect(screen.getByText('Wallet status: disconnected')).toBeInTheDocument();
  });

  it('shows wallet status when connected', () => {
    render(
      <EscrowLock
        deliveryId="delivery-1"
        amount={100.5}
        currency="USDC"
        walletAddress="0x123...789"
      />
    );

    expect(screen.getByText('Wallet status: connected')).toBeInTheDocument();
  });
});
