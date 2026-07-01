import { render, screen } from '@testing-library/react';
import { SignatureProgressBar } from '../SignatureProgressBar';

describe('SignatureProgressBar', () => {
  it('should render a message when multi-signature is not required', () => {
    render(<SignatureProgressBar current={0} required={0} />);
    expect(
      screen.getByText('Multi-signature not required for this escrow.'),
    ).toBeInTheDocument();
  });

  it('should render the progress correctly for an incomplete state (1 of 3)', () => {
    render(<SignatureProgressBar current={1} required={3} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    // Note: Jest stringifies the style, so we check for the substring.
    expect(progressbar.style.width).toContain('33.33');
    expect(progressbar).toHaveClass('bg-blue-600');
    expect(progressbar).toHaveAttribute('aria-valuenow', '33.33333333333333');

    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    expect(screen.getByText('1 of 3')).toHaveClass('text-gray-500');
  });

  it('should render the progress correctly for a complete state (3 of 3)', () => {
    render(<SignatureProgressBar current={3} required={3} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveStyle('width: 100%');
    expect(progressbar).toHaveClass('bg-green-500');
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');

    expect(screen.getByText('3 of 3')).toBeInTheDocument();
    expect(screen.getByText('3 of 3')).toHaveClass('text-green-600');
  });

  it('should cap the progress at 100% if current signatures exceed required', () => {
    render(<SignatureProgressBar current={5} required={4} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveStyle('width: 100%');
    expect(progressbar).toHaveClass('bg-green-500');
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');

    expect(screen.getByText('5 of 4')).toBeInTheDocument();
    expect(screen.getByText('5 of 4')).toHaveClass('text-green-600');
  });
});