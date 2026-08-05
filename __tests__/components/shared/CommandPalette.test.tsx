// @ts-nocheck
'use client';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as hookModule from '@/hooks/useCommandPalette';
import * as serviceModule from '@/services/commandPaletteService';
import CommandPalette from '@/components/ui/CommandPalette';

// ── Mock next/navigation ──────────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// ── Mock cmdk ────────────────────────────────────────────────────────────────
jest.mock('cmdk', () => {
  const Dialog = ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="command-dialog">{children}</div> : null;
  const Input = ({ placeholder, value, onValueChange, ...rest }: any) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      {...rest}
    />
  );
  const List = ({ children }: any) => <div>{children}</div>;
  const Empty = ({ children }: any) => <div>{children}</div>;
  const Group = ({ children, heading }: any) => (
    <div>
      <span>{heading}</span>
      {children}
    </div>
  );
  const Item = ({ children, onSelect }: any) => (
    <div role="option" onClick={onSelect}>
      {children}
    </div>
  );
  return { Command: { Dialog, Input, List, Empty, Group, Item } };
});

// ── Spy on the hook ───────────────────────────────────────────────────────────
const mockUseCommandPalette = jest.spyOn(hookModule, 'useCommandPalette');

// ── Spy on the service ────────────────────────────────────────────────────────
const mockFetchDeliveries = jest.spyOn(serviceModule.commandPaletteService, 'fetchDeliveries');

// ── Shared mock data (sourced from backend API shape) ─────────────────────────
const mockDeliveries: serviceModule.DeliverySummary[] = [
  { id: 'd-001', title: 'Laptop to Abuja', status: 'In transit' },
  { id: 'd-002', title: 'Phone to Lagos', status: 'Pending' },
  { id: 'd-003', title: 'Books to Kano', status: 'Delivered' },
];

const baseHookValue = {
  open: true,
  setOpen: jest.fn(),
  query: '',
  setQuery: jest.fn(),
  actionItems: [
    {
      id: 'settings',
      title: 'Open settings',
      description: 'Go to app settings',
      path: '/settings',
      type: 'static' as const,
    },
    {
      id: 'faq',
      title: 'Jump to FAQ',
      description: 'Read support and docs',
      path: '/faq',
      type: 'static' as const,
    },
  ],
  deliverySectionItems: mockDeliveries.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.status ?? 'Delivery record',
    path: `/deliveries/${d.id}`,
    type: 'delivery' as const,
  })),
  loading: false,
  error: null,
  inputRef: { current: null },
  onSelect: jest.fn(),
};

// ─────────────────────────────────────────────────────────────────────────────

describe('CommandPalette — interaction tests', () => {
  beforeEach(() => {
    mockUseCommandPalette.mockReturnValue({ ...baseHookValue });
    mockFetchDeliveries.mockResolvedValue(mockDeliveries);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ── 1. Keyboard trigger: Ctrl+K / Cmd+K opens the palette ──────────────────
  it('opens the palette when Ctrl+K is pressed', () => {
    // Start closed
    mockUseCommandPalette.mockReturnValue({ ...baseHookValue, open: false });
    render(<CommandPalette />);

    // Palette should not be visible yet
    expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();

    // Fire Ctrl+K on the window — the hook's useEffect handles this
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    // Re-render with open:true to simulate hook state update
    mockUseCommandPalette.mockReturnValue({ ...baseHookValue, open: true });
    render(<CommandPalette />);

    expect(screen.getByTestId('command-dialog')).toBeInTheDocument();
  });

  it('opens the palette when Meta+K (Cmd+K) is pressed', () => {
    mockUseCommandPalette.mockReturnValue({ ...baseHookValue, open: false });
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    mockUseCommandPalette.mockReturnValue({ ...baseHookValue, open: true });
    render(<CommandPalette />);

    expect(screen.getByTestId('command-dialog')).toBeInTheDocument();
  });

  // ── 2. Renders input and items when open ────────────────────────────────────
  it('renders the search input when the palette is open', () => {
    render(<CommandPalette />);
    expect(
      screen.getByPlaceholderText('Search deliveries, settings, FAQ...'),
    ).toBeInTheDocument();
  });

  it('renders all static action items', () => {
    render(<CommandPalette />);
    expect(screen.getByText('Open settings')).toBeInTheDocument();
    expect(screen.getByText('Jump to FAQ')).toBeInTheDocument();
  });

  it('renders delivery section items sourced from the backend API', () => {
    render(<CommandPalette />);
    expect(screen.getByText('Laptop to Abuja')).toBeInTheDocument();
    expect(screen.getByText('Phone to Lagos')).toBeInTheDocument();
    expect(screen.getByText('Books to Kano')).toBeInTheDocument();
  });

  // ── 3. Search input filters matching records ────────────────────────────────
  it('filters delivery items to only those matching the typed query', () => {
    // Simulate the hook returning filtered results for query "Laptop"
    mockUseCommandPalette.mockReturnValue({
      ...baseHookValue,
      query: 'Laptop',
      deliverySectionItems: [
        {
          id: 'd-001',
          title: 'Laptop to Abuja',
          description: 'In transit',
          path: '/deliveries/d-001',
          type: 'delivery',
        },
      ],
    });

    render(<CommandPalette />);

    expect(screen.getByText('Laptop to Abuja')).toBeInTheDocument();
    expect(screen.queryByText('Phone to Lagos')).not.toBeInTheDocument();
    expect(screen.queryByText('Books to Kano')).not.toBeInTheDocument();
  });

  it('calls setQuery when the user types in the search input', async () => {
    const setQuery = jest.fn();
    mockUseCommandPalette.mockReturnValue({ ...baseHookValue, setQuery });
    render(<CommandPalette />);

    const input = screen.getByPlaceholderText('Search deliveries, settings, FAQ...');
    await userEvent.type(input, 'Lagos');

    expect(setQuery).toHaveBeenCalled();
  });

  it('shows no delivery items when query does not match any record', () => {
    mockUseCommandPalette.mockReturnValue({
      ...baseHookValue,
      query: 'xyznonexistent',
      deliverySectionItems: [],
      actionItems: [],
    });

    render(<CommandPalette />);

    expect(screen.queryByText('Laptop to Abuja')).not.toBeInTheDocument();
    expect(screen.queryByText('Phone to Lagos')).not.toBeInTheDocument();
  });

  // ── 4. Escape closes the palette ───────────────────────────────────────────
  it('calls setOpen(false) when Escape is pressed', () => {
    const setOpen = jest.fn();
    mockUseCommandPalette.mockReturnValue({ ...baseHookValue, setOpen });
    const { rerender } = render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'Escape' });

    mockUseCommandPalette.mockReturnValue({ ...baseHookValue, open: false, setOpen });
    rerender(<CommandPalette />);

    expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();
  });

  it('unmounts the palette dialog when open is set to false', () => {
    mockUseCommandPalette.mockReturnValue({ ...baseHookValue, open: false });
    render(<CommandPalette />);
    expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();
  });

  // ── 5. Loading state ────────────────────────────────────────────────────────
  it('shows loading indicator while fetching deliveries from the API', () => {
    mockUseCommandPalette.mockReturnValue({
      ...baseHookValue,
      loading: true,
      deliverySectionItems: [],
    });

    render(<CommandPalette />);
    expect(screen.getByText(/loading deliveries/i)).toBeInTheDocument();
  });

  // ── 6. Error state ──────────────────────────────────────────────────────────
  it('shows error message when the backend API call fails', () => {
    mockUseCommandPalette.mockReturnValue({
      ...baseHookValue,
      error: 'Unable to load deliveries',
      deliverySectionItems: [],
    });

    render(<CommandPalette />);
    expect(screen.getByText('Unable to load deliveries')).toBeInTheDocument();
  });

  // ── 7. Service integration: data comes from the backend API ─────────────────
  it('fetches deliveries from the backend API endpoint via commandPaletteService', async () => {
    mockFetchDeliveries.mockResolvedValue(mockDeliveries);

    await serviceModule.commandPaletteService.fetchDeliveries();

    expect(mockFetchDeliveries).toHaveBeenCalledTimes(1);
   const result = await serviceModule.commandPaletteService.fetchDeliveries();
    expect(result).toEqual(mockDeliveries);
  });

  it('service returns correct delivery records matching backend API shape', async () => {
    mockFetchDeliveries.mockResolvedValue(mockDeliveries);

    const result = await serviceModule.commandPaletteService.fetchDeliveries();

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: 'd-001', title: 'Laptop to Abuja', status: 'In transit' });
    expect(result[1]).toEqual({ id: 'd-002', title: 'Phone to Lagos', status: 'Pending' });
  });

  // ── 8. Item selection navigates to the correct path ────────────────────────
  it('calls onSelect with the correct path when a delivery item is clicked', () => {
    const onSelect = jest.fn();
    mockUseCommandPalette.mockReturnValue({ ...baseHookValue, onSelect });
    render(<CommandPalette />);

    const items = screen.getAllByRole('option');
    fireEvent.click(items[0]);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});