import { render, screen } from '@testing-library/react';
import { FaqPageShell } from '@/components/support/FaqPageShell';

describe('FaqPageShell', () => {
  it('renders the FAQ heading and bottom CTA content', () => {
    render(<FaqPageShell />);

    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument();
    expect(screen.getByText(/ready to secure your shipments/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /book a demo/i })).toHaveAttribute('href', '/support');
    expect(screen.getByRole('link', { name: /contact support/i })).toHaveAttribute('href', '/support');
  });
});
