import { render, screen, fireEvent, act } from '@testing-library/react';
import { SignerList } from '../SignerList';

// Mock the clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

const mockSigners = [
  'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
  'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB5432',
];

describe('SignerList', () => {
  beforeEach(() => {
    (navigator.clipboard.writeText as jest.Mock).mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render a message when no signers are present but signatures are required', () => {
    render(<SignerList signers={[]} requiredSignatures={2} />);
    expect(
      screen.getByText('No signatures have been recorded yet.'),
    ).toBeInTheDocument();
  });

  it('should render nothing when no signers are present and none are required', () => {
    const { container } = render(
      <SignerList signers={[]} requiredSignatures={0} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should render a list of signers with truncated keys', () => {
    render(<SignerList signers={mockSigners} requiredSignatures={2} />);

    expect(screen.getByText('GAAAAAAA...AAAAWHF')).toBeInTheDocument();
    expect(screen.getByText('GBBBBBBB...BBBB5432')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBe(2);
  });

  it('should copy a key to the clipboard and show feedback', () => {
    render(<SignerList signers={mockSigners} requiredSignatures={2} />);

    const copyButtons = screen.getAllByTitle('Copy public key');
    expect(copyButtons.length).toBe(2);

    // Click the first copy button
    fireEvent.click(copyButtons[0]);

    // Check that clipboard.writeText was called with the full key
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockSigners[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);

    // The icon should change to a checkmark, which has a distinct green color
    const checkIcon = copyButtons[0].querySelector('.text-green-500');
    expect(checkIcon).toBeInTheDocument();

    // The other button should still have the default copy icon
    const otherButtonCheckIcon = copyButtons[1].querySelector('.text-green-500');
    expect(otherButtonCheckIcon).not.toBeInTheDocument();

    // Fast-forward time to reset the copied state
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // The checkmark icon should be gone, reverting to the copy icon
    const checkIconAfterTimeout = copyButtons[0].querySelector('.text-green-500');
    expect(checkIconAfterTimeout).not.toBeInTheDocument();
  });
});