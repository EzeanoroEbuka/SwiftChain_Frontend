import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BalanceWarning from '../BalanceWarning';

// Mock the CSS import
jest.mock('../BalanceWarning.css', () => ({}));

// Mock the wallet service
jest.mock('../../../services/walletService', () => ({
  walletService: {
    getCachedBalance: jest.fn(),
    fetchBalance: jest.fn(),
    checkSufficientBalance: jest.fn(),
    prefetchBalance: jest.fn(),
    clearCache: jest.fn(),
  }
}));

// Import after mocking
import { walletService } from '../../../services/walletService';

describe('BalanceWarning', () => {
  const mockBalance = {
    available: 50,
    locked: 10,
    pending: 5,
    total: 65,
    currency: 'USD',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for checkSufficientBalance
    (walletService.checkSufficientBalance as jest.Mock).mockResolvedValue({
      hasSufficientBalance: false,
      balance: mockBalance,
      requiredAmount: 100,
    });
  });

  it('should show warning when balance is insufficient', async () => {
    (walletService.getCachedBalance as jest.Mock).mockReturnValue(mockBalance);
    (walletService.fetchBalance as jest.Mock).mockResolvedValue(mockBalance);

    render(
      <BalanceWarning 
        requiredAmount={100} 
        showImmediately={true}
        reserveSpace={true}
      />
    );

    // Warning should appear
    await waitFor(() => {
      expect(screen.getByTestId('balance-warning')).toBeInTheDocument();
    });
  });

  it('should NOT show warning when balance is sufficient', async () => {
    const sufficientBalance = { ...mockBalance, available: 200 };
    (walletService.getCachedBalance as jest.Mock).mockReturnValue(sufficientBalance);
    (walletService.fetchBalance as jest.Mock).mockResolvedValue(sufficientBalance);
    (walletService.checkSufficientBalance as jest.Mock).mockResolvedValue({
      hasSufficientBalance: true,
      balance: sufficientBalance,
      requiredAmount: 100,
    });

    render(
      <BalanceWarning 
        requiredAmount={100} 
        showImmediately={true}
        reserveSpace={true}
      />
    );

    // Warning should not appear
    await waitFor(() => {
      expect(screen.queryByTestId('balance-warning')).not.toBeInTheDocument();
    });
  });

  it('should reserve space to prevent layout jumping', () => {
    (walletService.getCachedBalance as jest.Mock).mockReturnValue(null);

    const { container } = render(
      <BalanceWarning 
        requiredAmount={100} 
        showImmediately={false}
        reserveSpace={true}
      />
    );

    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toHaveStyle('minHeight: 60px');
  });

  it('should handle retry button click', async () => {
    const user = userEvent.setup();
    
    (walletService.getCachedBalance as jest.Mock).mockReturnValue(mockBalance);
    (walletService.fetchBalance as jest.Mock).mockResolvedValue(mockBalance);

    render(
      <BalanceWarning 
        requiredAmount={100} 
        showImmediately={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('balance-warning')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /Retry balance check/i });
    await user.click(retryButton);

    expect(walletService.fetchBalance).toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', async () => {
    const onCloseMock = jest.fn();
    const user = userEvent.setup();

    (walletService.getCachedBalance as jest.Mock).mockReturnValue(mockBalance);
    (walletService.fetchBalance as jest.Mock).mockResolvedValue(mockBalance);

    render(
      <BalanceWarning 
        requiredAmount={100} 
        showImmediately={true}
        onClose={onCloseMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('balance-warning')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /Close warning/i });
    await user.click(closeButton);

    expect(onCloseMock).toHaveBeenCalled();
    expect(screen.queryByTestId('balance-warning')).not.toBeInTheDocument();
  });

  it('should show different variants based on severity', async () => {
    const lowBalance = { ...mockBalance, available: 10 };
    (walletService.getCachedBalance as jest.Mock).mockReturnValue(lowBalance);
    (walletService.fetchBalance as jest.Mock).mockResolvedValue(lowBalance);
    (walletService.checkSufficientBalance as jest.Mock).mockResolvedValue({
      hasSufficientBalance: false,
      balance: lowBalance,
      requiredAmount: 100,
    });

    render(
      <BalanceWarning 
        requiredAmount={100} 
        showImmediately={true}
      />
    );

    await waitFor(() => {
      const warning = screen.getByTestId('balance-warning');
      expect(warning).toHaveClass('balance-warning--danger');
    });
  });

  it('should update when balance changes', async () => {
    (walletService.getCachedBalance as jest.Mock).mockReturnValue(mockBalance);
    (walletService.fetchBalance as jest.Mock).mockResolvedValue(mockBalance);

    const { rerender } = render(
      <BalanceWarning 
        requiredAmount={100} 
        showImmediately={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('balance-warning')).toBeInTheDocument();
    });

    // Update balance to sufficient
    const sufficientBalance = { ...mockBalance, available: 200 };
    (walletService.getCachedBalance as jest.Mock).mockReturnValue(sufficientBalance);
    (walletService.checkSufficientBalance as jest.Mock).mockResolvedValue({
      hasSufficientBalance: true,
      balance: sufficientBalance,
      requiredAmount: 100,
    });

    rerender(
      <BalanceWarning 
        requiredAmount={100} 
        showImmediately={true}
      />
    );

    // Warning should disappear
    await waitFor(() => {
      expect(screen.queryByTestId('balance-warning')).not.toBeInTheDocument();
    });
  });
});