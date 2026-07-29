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
import { CallToAction } from '@/components/landing/CallToAction';
import { useCallToAction } from '@/hooks/useCallToAction';

jest.mock('@/hooks/useCallToAction');
const mockUseCallToAction = useCallToAction as jest.Mock;

const mockFormRegister = jest.fn().mockReturnValue({});
const mockFormHandleSubmit = jest.fn((fn: (values: Record<string, unknown>) => Promise<void>) => fn);

const baseMock = {
  form: {
    register: mockFormRegister,
    handleSubmit: mockFormHandleSubmit,
    formState: {
      errors: {},
      isDirty: false,
      isValid: true,
    },
    reset: jest.fn(),
  },
  isSubmitting: false,
  isSuccess: false,
  responseMessage: null,
  error: null,
  onSubmit: jest.fn(),
  resetForm: jest.fn(),
};

describe('CallToAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the headline and email input', () => {
    mockUseCallToAction.mockReturnValue(baseMock);

    render(<CallToAction />);

    expect(screen.getByText(/Ready to/i)).toBeInTheDocument();
    expect(screen.getByText(/Chain/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your work email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get Access/i })).toBeInTheDocument();
  });

  it('shows validation error when email is invalid', () => {
    mockUseCallToAction.mockReturnValue({
      ...baseMock,
      form: {
        ...baseMock.form,
        formState: {
          errors: { email: { message: 'Please enter a valid email address' } },
          isDirty: true,
          isValid: false,
        },
      },
    });

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
      screen.getByText('Please enter a valid email address'),
    ).toBeInTheDocument();
  });

  it('shows success state after submission', () => {
    mockUseCallToAction.mockReturnValue({
      ...baseMock,
      isSuccess: true,
      responseMessage: 'You are on the waitlist!',
    });

    render(<CallToAction />);

    expect(screen.getByText('You are on the waitlist!')).toBeInTheDocument();
    expect(screen.getByText(/We'll be in touch soon/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Enter your work email/i)).not.toBeInTheDocument();
  });

  it('shows error state when submission fails', () => {
    mockUseCallToAction.mockReturnValue({
      ...baseMock,
      error: 'Something went wrong. Please try again.',
    });

    render(<CallToAction />);

    expect(
      screen.getByText('Something went wrong. Please try again.'),
    ).toBeInTheDocument();
  });

  it('disables the submit button while submitting', () => {
    mockUseCallToAction.mockReturnValue({
      ...baseMock,
      isSubmitting: true,
    });

    render(<CallToAction />);

    const button = screen.getByRole('button', { name: /Sending/i });
    expect(button).toBeDisabled();
  });

  it('renders the trust indicator text', () => {
    mockUseCallToAction.mockReturnValue(baseMock);

    render(<CallToAction />);

    expect(
      screen.getByText(/2,500\+ logistics professionals/i),
    ).toBeInTheDocument();
  });
});
