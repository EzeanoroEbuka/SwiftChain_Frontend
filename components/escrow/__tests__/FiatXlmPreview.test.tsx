/**
 * Tests for FiatXlmPreview component
 *
 * Covers:
 * - Rendering of payment details
 * - Warning display for 2% slippage
 * - Critical warning with checkbox for 5% slippage
 * - Submission blocking when acknowledgment not checked
 * - Button state management
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FiatXlmPreview } from '@/components/escrow/FiatXlmPreview';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hook
jest.mock('@/hooks/useFiatXlmSlippage', () => ({
  useFiatXlmSlippage: jest.fn(),
}));

import { useFiatXlmSlippage } from '@/hooks/useFiatXlmSlippage';

// Mock the service
jest.mock('@/services/fxService', () => ({
  formatNgn: (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },
}));

const createQueryClient = () => new QueryClient();

const mockUseFiatXlmSlippage = useFiatXlmSlippage as jest.Mock;

describe('FiatXlmPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFiatXlmSlippage.mockReturnValue({
      quotedRate: 1000,
      slippage: null,
      isVolatile: false,
      requiresAcknowledgment: false,
      isAcknowledged: false,
      setAcknowledged: jest.fn(),
      startQuote: jest.fn(),
      stopQuote: jest.fn(),
      isLoadingRate: false,
    });
  });

  const renderComponent = (props: Partial<React.ComponentProps<typeof FiatXlmPreview>> = {}) => {
    const defaultProps = {
      xlmAmount: 10,
      quotedNgnAmount: 10000,
      currentRate: 1000,
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
      ...props,
    };

    const queryClient = createQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <FiatXlmPreview {...defaultProps} />
      </QueryClientProvider>
    );
  };

  describe('rendering', () => {
    it('should render the component with payment details', () => {
      renderComponent();

      expect(screen.getByText('Payment Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Review before confirming the payment')).toBeInTheDocument();
      expect(screen.getByText('10.00 XLM')).toBeInTheDocument();
    });

    it('should display the quoted NGN amount', () => {
      renderComponent({ xlmAmount: 10, quotedNgnAmount: 10000 });

      expect(screen.getByText(/Quoted Rate/)).toBeInTheDocument();
    });

    it('should render confirm and cancel buttons', () => {
      renderComponent();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('should call onCancel when cancel button is clicked', () => {
      const mockCancel = jest.fn();
      renderComponent({ onCancel: mockCancel });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockCancel).toHaveBeenCalled();
    });
  });

  describe('warning display', () => {
    it('should not display warning when slippage is minimal', () => {
      renderComponent();

      expect(screen.queryByText(/FX Rate Volatility Detected/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/High FX Rate Volatility/i)).not.toBeInTheDocument();
    });

    it('should display warning for volatile slippage (>2%)', () => {
      mockUseFiatXlmSlippage.mockReturnValue({
        quotedRate: 1000,
        slippage: {
          slippagePercent: 3,
          isVolatile: true,
          requiresAcknowledgment: false,
          currentRate: 1030,
          quotedRate: 1000,
        },
        isVolatile: true,
        requiresAcknowledgment: false,
        isAcknowledged: false,
        setAcknowledged: jest.fn(),
        startQuote: jest.fn(),
        stopQuote: jest.fn(),
        isLoadingRate: false,
      });

      renderComponent({ currentRate: 1030 });

      expect(screen.getByText(/FX Rate Volatility Detected/i)).toBeInTheDocument();
    });

    it('should display critical warning for slippage >5%', () => {
      mockUseFiatXlmSlippage.mockReturnValue({
        quotedRate: 1000,
        slippage: {
          slippagePercent: 6,
          isVolatile: true,
          requiresAcknowledgment: true,
          currentRate: 1060,
          quotedRate: 1000,
        },
        isVolatile: true,
        requiresAcknowledgment: true,
        isAcknowledged: false,
        setAcknowledged: jest.fn(),
        startQuote: jest.fn(),
        stopQuote: jest.fn(),
        isLoadingRate: false,
      });

      renderComponent({ currentRate: 1060 });

      expect(screen.getByText(/High FX Rate Volatility/i)).toBeInTheDocument();
    });
  });

  describe('acknowledgment checkbox', () => {
    beforeEach(() => {
      mockUseFiatXlmSlippage.mockReturnValue({
        quotedRate: 1000,
        slippage: {
          slippagePercent: 6,
          isVolatile: true,
          requiresAcknowledgment: true,
          currentRate: 1060,
          quotedRate: 1000,
        },
        isVolatile: true,
        requiresAcknowledgment: true,
        isAcknowledged: false,
        setAcknowledged: jest.fn(),
        startQuote: jest.fn(),
        stopQuote: jest.fn(),
        isLoadingRate: false,
      });
    });

    it('should show checkbox when slippage is critical', () => {
      renderComponent({ currentRate: 1060 });

      const checkbox = screen.getByLabelText(/I acknowledge the rate volatility/i) as HTMLInputElement;
      expect(checkbox).toBeInTheDocument();
      expect(checkbox.checked).toBe(false);
    });

    it('should block submission when checkbox is not checked', () => {
      renderComponent({ currentRate: 1060 });

      const buttons = screen.getAllByRole('button');
      const confirmBtn = buttons.find(btn => btn.textContent?.includes('Confirm'));
      
      expect(confirmBtn).toBeDisabled();
    });

    it('should enable submission after acknowledgment', () => {
      mockUseFiatXlmSlippage.mockReturnValue({
        quotedRate: 1000,
        slippage: {
          slippagePercent: 6,
          isVolatile: true,
          requiresAcknowledgment: true,
          currentRate: 1060,
          quotedRate: 1000,
        },
        isVolatile: true,
        requiresAcknowledgment: true,
        isAcknowledged: true,
        setAcknowledged: jest.fn(),
        startQuote: jest.fn(),
        stopQuote: jest.fn(),
        isLoadingRate: false,
      });

      const mockConfirm = jest.fn();
      renderComponent({ onConfirm: mockConfirm, currentRate: 1060 });

      const buttons = screen.getAllByRole('button');
      const confirmBtn = buttons.find(btn => btn.textContent?.includes('Confirm'));
      
      expect(confirmBtn).not.toBeDisabled();
    });
  });

  describe('submission behavior', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      const mockConfirm = jest.fn();
      renderComponent({ onConfirm: mockConfirm });

      const buttons = screen.getAllByRole('button');
      const confirmBtn = buttons.find(btn => btn.textContent?.includes('Confirm'));
      fireEvent.click(confirmBtn!);

      expect(mockConfirm).toHaveBeenCalled();
    });

    it('should show loading state during submission', () => {
      renderComponent({ isSubmitting: true });

      expect(screen.getByText(/Processing…/)).toBeInTheDocument();
    });
  });

  describe('rate change display', () => {
    it('should display current rate when it differs from quoted rate', () => {
      mockUseFiatXlmSlippage.mockReturnValue({
        quotedRate: 1000,
        slippage: {
          slippagePercent: 3,
          isVolatile: true,
          requiresAcknowledgment: false,
          currentRate: 1030,
          quotedRate: 1000,
        },
        isVolatile: true,
        requiresAcknowledgment: false,
        isAcknowledged: false,
        setAcknowledged: jest.fn(),
        startQuote: jest.fn(),
        stopQuote: jest.fn(),
        isLoadingRate: false,
      });

      renderComponent({ currentRate: 1030 });

      expect(screen.getByText(/Current Rate/)).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should show loading state when fetching rates', () => {
      mockUseFiatXlmSlippage.mockReturnValue({
        quotedRate: 1000,
        slippage: null,
        isVolatile: false,
        requiresAcknowledgment: false,
        isAcknowledged: false,
        setAcknowledged: jest.fn(),
        startQuote: jest.fn(),
        stopQuote: jest.fn(),
        isLoadingRate: true,
      });

      renderComponent();

      expect(screen.getByText(/Checking current rates/i)).toBeInTheDocument();
    });
  });
});
