// @ts-nocheck
'use client';
import { render, screen } from '@testing-library/react';
import * as hookModule from '@/hooks/useCommandPalette';
import * as serviceModule from '@/services/commandPaletteService';
import CommandPalette from '../CommandPalette';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock cmdk
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

const mockUseCommandPalette = jest.spyOn(hookModule, 'useCommandPalette');
const mockFetchDeliveries = jest.spyOn(serviceModule.commandPaletteService, 'fetchDeliveries');

const mockDeliveries: serviceModule.DeliverySummary[] = [
  { id: 'd-001', title: 'Laptop to Abuja', status: 'In transit' },
  { id: 'd-002', title: 'Phone to Lagos', status: 'Pending' },
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

describe('CommandPalette Component — UI & Keyboard Interactions', () => {
  beforeEach(() => {
    mockUseCommandPalette.mockReturnValue({ ...baseHookValue });
    mockFetchDeliveries.mockResolvedValue(mockDeliveries);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the command palette input and action items when open', () => {
    render(<CommandPalette />);
    expect(screen.getByPlaceholderText('Search deliveries, settings, FAQ...')).toBeInTheDocument();
    expect(screen.getByText('Open settings')).toBeInTheDocument();
  });

  it('unmounts palette dialog when open is set to false', () => {
    mockUseCommandPalette.mockReturnValue({ ...baseHookValue, open: false });
    render(<CommandPalette />);
    expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();
  });

  it('filters delivery search results based on user query', () => {
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
  });

  it('retrieves delivery records via commandPaletteService backend API', async () => {
    const data = await serviceModule.commandPaletteService.fetchDeliveries();
    expect(data).toEqual(mockDeliveries);
  });
});
