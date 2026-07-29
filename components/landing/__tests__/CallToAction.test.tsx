import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CallToAction } from '../CallToAction';
import type { CtaResponse } from '@/types/cta';

// ── Mock the hook ──────────────────────────────────────────────
interface MockState {
  email: string;
  setEmail: jest.Mock;
  isSubmitting: boolean;
  error: string | null;
  success: CtaResponse | null;
  isValid: boolean;
  onSubmit: jest.Mock;
  resetForm: jest.Mock;
}

const mockResetForm = jest.fn();
const mockOnSubmit = jest.fn();

let mockState: MockState = {
  email: '',
  setEmail: jest.fn(),
  isSubmitting: false,
  error: null,
  success: null,
  isValid: false,
  onSubmit: mockOnSubmit,
  resetForm: mockResetForm,
};

jest.mock('@/hooks/useCallToAction', () => ({
  useCallToAction: () => mockState,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockState = {
    email: '',
    setEmail: jest.fn(),
    isSubmitting: false,
    error: null,
    success: null,
    isValid: false,
    onSubmit: mockOnSubmit,
    resetForm: mockResetForm,
  };
});

describe('CallToAction', () => {
  it('renders the heading and email input', () => {
    render(<CallToAction />);

    expect(
      screen.getByRole('heading', { level: 2, name: /Chain.*Logistics/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/you@company.com/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Get Access/i }),
    ).toBeInTheDocument();
  });

  it('shows validation error when submitting with invalid email', () => {
    const { rerender } = render(<CallToAction />);

    mockState = { ...mockState, error: 'Please enter a valid email address.' };
    rerender(<CallToAction />);

    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
  });

  it('renders the success state after a successful submission', () => {
    mockState = {
      ...mockState,
      success: {
        message: "We'll notify you as soon as SwiftChain launches.",
        success: true,
      },
    };

    render(<CallToAction />);

    expect(
      screen.getByRole('heading', { level: 2, name: /on the list/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Register another email/i)).toBeInTheDocument();
  });

  it('calls resetForm when "Register another email" is clicked in success state', async () => {
    const user = userEvent.setup();

    mockState = {
      ...mockState,
      success: {
        message: "We'll notify you as soon as SwiftChain launches.",
        success: true,
      },
    };

    render(<CallToAction />);

    await user.click(screen.getByText(/Register another email/i));
    expect(mockResetForm).toHaveBeenCalledTimes(1);
  });

  it('shows error message when submission fails', () => {
    mockState = { ...mockState, error: 'Network error. Please try again.' };

    render(<CallToAction />);

    expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
  });

  it('disables the button while submitting', () => {
    mockState = { ...mockState, isSubmitting: true };

    render(<CallToAction />);

    expect(screen.getByRole('button', { name: /Submitting/i })).toBeDisabled();
  });

  it('renders the trust indicator section', () => {
    render(<CallToAction />);

    expect(screen.getByText(/2,500\+ logistics professionals/i)).toBeInTheDocument();
    expect(screen.getByText(/No spam, ever/i)).toBeInTheDocument();
    expect(screen.getByText(/Your data is safe/i)).toBeInTheDocument();
  });
});
