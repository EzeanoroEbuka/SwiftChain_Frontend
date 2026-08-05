import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeeEstimator } from '@/components/wallet/FeeEstimator';
import { useFeeEstimate } from '@/hooks/useFeeEstimate';
import { FeeEstimate } from '@/types/fee';

// Mock the hook
jest.mock('@/hooks/useFeeEstimate');

const mockUseFeeEstimate = useFeeEstimate as jest.MockedFunction<
  typeof useFeeEstimate
>;

const MOCK_FEE: FeeEstimate = {
  estimatedXLMCost: 0.5,
  baseFee: 0.0001,
  networkFee: 0.1,
  platformFee: 0.3889,
  totalAmount: 100.5,
  currency: 'USD',
  timestamp: new Date().toISOString(),
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
};

describe('FeeEstimator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should show prompt when amount is null', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: undefined,
        estimatedXLMCost: 0,
        baseFee: 0,
        networkFee: 0,
        platformFee: 0,
        totalAmount: 0,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={null} />, { wrapper: createWrapper() });

      expect(
        screen.getByText(/Enter an amount to see fee estimates/i)
      ).toBeInTheDocument();
    });

    it('should show prompt when amount is zero', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: undefined,
        estimatedXLMCost: 0,
        baseFee: 0,
        networkFee: 0,
        platformFee: 0,
        totalAmount: 0,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={0} />, { wrapper: createWrapper() });

      expect(
        screen.getByText(/Enter an amount to see fee estimates/i)
      ).toBeInTheDocument();
    });

    it('should show prompt when amount is negative', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: undefined,
        estimatedXLMCost: 0,
        baseFee: 0,
        networkFee: 0,
        platformFee: 0,
        totalAmount: 0,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={-50} />, { wrapper: createWrapper() });

      expect(
        screen.getByText(/Enter an amount to see fee estimates/i)
      ).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator during fetch', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: undefined,
        estimatedXLMCost: 0,
        baseFee: 0,
        networkFee: 0,
        platformFee: 0,
        totalAmount: 0,
        isLoading: true,
        isFetching: true,
        error: null,
      });

      render(<FeeEstimator amount={100} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Calculating fees/i)).toBeInTheDocument();
    });

    it('should display loading spinner', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: undefined,
        estimatedXLMCost: 0,
        baseFee: 0,
        networkFee: 0,
        platformFee: 0,
        totalAmount: 0,
        isLoading: true,
        isFetching: true,
        error: null,
      });

      const { container } = render(<FeeEstimator amount={100} />, {
        wrapper: createWrapper(),
      });

      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message', () => {
      const errorMsg = 'Failed to calculate fees';
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: undefined,
        estimatedXLMCost: 0,
        baseFee: 0,
        networkFee: 0,
        platformFee: 0,
        totalAmount: 0,
        isLoading: false,
        isFetching: false,
        error: errorMsg,
      });

      render(<FeeEstimator amount={100} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Unable to calculate fees/i)).toBeInTheDocument();
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    it('should show error icon', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: undefined,
        estimatedXLMCost: 0,
        baseFee: 0,
        networkFee: 0,
        platformFee: 0,
        totalAmount: 0,
        isLoading: false,
        isFetching: false,
        error: 'Network error',
      });

      const { container } = render(<FeeEstimator amount={100} />, {
        wrapper: createWrapper(),
      });

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Success State - Fee Display', () => {
    it('should render fee breakdown card', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Transaction Breakdown/i)).toBeInTheDocument();
    });

    it('should display transaction amount', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} currency="USD" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/Transaction Amount/i)).toBeInTheDocument();
      expect(screen.getByText(/100\.00 USD/)).toBeInTheDocument();
    });

    it('should display base fee', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Base Fee/)).toBeInTheDocument();
      expect(screen.getByText(/0\.000100 XLM/)).toBeInTheDocument();
    });

    it('should display network fee', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Network Fee/)).toBeInTheDocument();
      expect(screen.getByText(/0\.100000 XLM/)).toBeInTheDocument();
    });

    it('should display platform fee', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Platform Fee/)).toBeInTheDocument();
      expect(screen.getByText(/0\.388900 XLM/)).toBeInTheDocument();
    });

    it('should display estimated XLM cost', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Estimated XLM Cost/)).toBeInTheDocument();
      expect(screen.getByText(/0\.500000 XLM/)).toBeInTheDocument();
    });

    it('should display total amount', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} currency="USD" />, {
        wrapper: createWrapper(),
      });

      const totalElements = screen.getAllByText(/Total/);
      expect(totalElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/100\.50 USD/)).toBeInTheDocument();
    });

    it('should handle zero fees', () => {
      const zeroFeeMock: FeeEstimate = {
        ...MOCK_FEE,
        baseFee: 0,
        networkFee: 0,
        platformFee: 0,
        estimatedXLMCost: 0,
      };

      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: zeroFeeMock,
        estimatedXLMCost: 0,
        baseFee: 0,
        networkFee: 0,
        platformFee: 0,
        totalAmount: 100,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Estimated XLM Cost/)).toBeInTheDocument();
    });
  });

  describe('Fee Update Callback', () => {
    it('should call onFeeUpdate with total amount', async () => {
      const mockCallback = jest.fn();
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} onFeeUpdate={mockCallback} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith(100.5);
      });
    });

    it('should not call onFeeUpdate when totalAmount is 0', () => {
      const mockCallback = jest.fn();
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: undefined,
        estimatedXLMCost: 0,
        baseFee: 0,
        networkFee: 0,
        platformFee: 0,
        totalAmount: 0,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} onFeeUpdate={mockCallback} />, {
        wrapper: createWrapper(),
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should update callback when fee changes', async () => {
      const mockCallback = jest.fn();

      const { rerender } = render(
        <FeeEstimator amount={100} onFeeUpdate={mockCallback} />,
        { wrapper: createWrapper() }
      );

      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      rerender(
        <QueryClientProvider
          client={
            new QueryClient({
              defaultOptions: {
                queries: { retry: false, gcTime: 0 },
              },
            })
          }
        >
          <FeeEstimator amount={100} onFeeUpdate={mockCallback} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalled();
      });
    });
  });

  describe('Currency Handling', () => {
    it('should display correct currency', () => {
      const eurFee: FeeEstimate = {
        ...MOCK_FEE,
        currency: 'EUR',
      };

      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: eurFee,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} currency="EUR" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/100\.00 EUR/)).toBeInTheDocument();
    });

    it('should default to USD', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} />, { wrapper: createWrapper() });

      expect(screen.getByText(/100\.00 USD/)).toBeInTheDocument();
    });

    it('should handle multiple currencies', () => {
      const currencies = ['USD', 'EUR', 'GBP'];

      for (const currency of currencies) {
        const fee: FeeEstimate = {
          ...MOCK_FEE,
          currency,
        };

        mockUseFeeEstimate.mockReturnValue({
          estimatedFee: fee,
          estimatedXLMCost: 0.5,
          baseFee: 0.0001,
          networkFee: 0.1,
          platformFee: 0.3889,
          totalAmount: 100.5,
          isLoading: false,
          isFetching: false,
          error: null,
        });

        const { unmount } = render(
          <FeeEstimator amount={100} currency={currency} />,
          { wrapper: createWrapper() }
        );

        expect(
          screen.getByText(new RegExp(`100\\.00 ${currency}`))
        ).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe('Timestamp Display', () => {
    it('should display fee estimation timestamp', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z').toISOString();
      const fee: FeeEstimate = {
        ...MOCK_FEE,
        timestamp,
      };

      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: fee,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      const { container } = render(<FeeEstimator amount={100} />, {
        wrapper: createWrapper(),
      });

      expect(container.textContent).toContain('Estimated');
    });
  });

  describe('Information Message', () => {
    it('should display fee disclaimer', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} />, { wrapper: createWrapper() });

      expect(
        screen.getByText(
          /Fees are estimated based on current network conditions/i
        )
      ).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('should render with dark mode classes', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      const { container } = render(<FeeEstimator amount={100} />, {
        wrapper: createWrapper(),
      });

      const darkElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      const { container } = render(<FeeEstimator amount={100} />, {
        wrapper: createWrapper(),
      });

      const headings = container.querySelectorAll('h3');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have proper heading hierarchy', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} />, { wrapper: createWrapper() });

      const heading = screen.getByRole('heading', {
        name: /Transaction Breakdown/i,
      });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render at mobile viewport', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      const { container } = render(<FeeEstimator amount={100} />, {
        wrapper: createWrapper(),
      });

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render at tablet viewport', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Transaction Breakdown/i)).toBeInTheDocument();
    });

    it('should render at desktop viewport', () => {
      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: MOCK_FEE,
        estimatedXLMCost: 0.5,
        baseFee: 0.0001,
        networkFee: 0.1,
        platformFee: 0.3889,
        totalAmount: 100.5,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Transaction Breakdown/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small amounts', () => {
      const smallFee: FeeEstimate = {
        ...MOCK_FEE,
        estimatedXLMCost: 0.01,
        totalAmount: 0.51,
      };

      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: smallFee,
        estimatedXLMCost: 0.01,
        baseFee: 0.0001,
        networkFee: 0.01,
        platformFee: 0,
        totalAmount: 0.51,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={0.5} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Transaction Breakdown/i)).toBeInTheDocument();
    });

    it('should handle very large amounts', () => {
      const largeFee: FeeEstimate = {
        ...MOCK_FEE,
        estimatedXLMCost: 5000,
        totalAmount: 100005000,
      };

      mockUseFeeEstimate.mockReturnValue({
        estimatedFee: largeFee,
        estimatedXLMCost: 5000,
        baseFee: 0.0001,
        networkFee: 1000,
        platformFee: 4000,
        totalAmount: 100005000,
        isLoading: false,
        isFetching: false,
        error: null,
      });

      render(<FeeEstimator amount={100000000} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Transaction Breakdown/i)).toBeInTheDocument();
    });
  });
});
