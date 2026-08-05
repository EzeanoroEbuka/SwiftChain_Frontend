import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeliveryFilters } from '@/features/deliveries/components';

describe('DeliveryFilters', () => {
  const mockHandlers = {
    onSearchChange: jest.fn(),
    onStatusChange: jest.fn(),
    onSortChange: jest.fn(),
    onClearAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter controls', () => {
    render(
      <DeliveryFilters
        search=""
        status={undefined}
        sortBy={undefined}
        hasActiveFilters={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByLabelText('Search by Tracking ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by date')).toBeInTheDocument();
  });

  it('displays search input with correct placeholder', () => {
    render(
      <DeliveryFilters
        search=""
        status={undefined}
        sortBy={undefined}
        hasActiveFilters={false}
        {...mockHandlers}
      />
    );

    const searchInput = screen.getByPlaceholderText('e.g., TRK123456');
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onSearchChange on blur with input value', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DeliveryFilters
        search=""
        status={undefined}
        sortBy={undefined}
        hasActiveFilters={false}
        {...mockHandlers}
      />
    );

    const searchInput = screen.getByPlaceholderText('e.g., TRK123456') as HTMLInputElement;
    await user.click(searchInput);
    await user.keyboard('TRK123');
    fireEvent.blur(searchInput);

    await waitFor(() => {
      expect(mockHandlers.onSearchChange).toHaveBeenCalledWith('TRK123');
    });
  });

  it('calls onSearchChange on Enter key', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        search=""
        status={undefined}
        sortBy={undefined}
        hasActiveFilters={false}
        {...mockHandlers}
      />
    );

    const searchInput = screen.getByPlaceholderText('e.g., TRK123456');
    await user.click(searchInput);
    await user.keyboard('TRK456{Enter}');

    await waitFor(() => {
      expect(mockHandlers.onSearchChange).toHaveBeenCalledWith('TRK456');
    });
  });

  it('clears search input when X button clicked', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        search="TRK123"
        status={undefined}
        sortBy={undefined}
        hasActiveFilters={true}
        {...mockHandlers}
      />
    );

    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    await waitFor(() => {
      expect(mockHandlers.onSearchChange).toHaveBeenCalledWith('');
    });
  });

  it('calls onStatusChange when status dropdown changes', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        search=""
        status={undefined}
        sortBy={undefined}
        hasActiveFilters={false}
        {...mockHandlers}
      />
    );

    const statusSelect = screen.getByDisplayValue('All Statuses');
    await user.selectOptions(statusSelect, 'DELIVERED');

    await waitFor(() => {
      expect(mockHandlers.onStatusChange).toHaveBeenCalledWith('DELIVERED');
    });
  });

  it('calls onSortChange when sort dropdown changes', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        search=""
        status={undefined}
        sortBy={undefined}
        hasActiveFilters={false}
        {...mockHandlers}
      />
    );

    const sortSelect = screen.getByDisplayValue('No Sort');
    await user.selectOptions(sortSelect, 'date-desc');

    await waitFor(() => {
      expect(mockHandlers.onSortChange).toHaveBeenCalledWith('date-desc');
    });
  });

  it('displays active filters when hasActiveFilters is true', () => {
    render(
      <DeliveryFilters
        search="TRK123"
        status="DELIVERED"
        sortBy="date-desc"
        hasActiveFilters={true}
        {...mockHandlers}
      />
    );

    expect(screen.getByText(/Search: TRK123/)).toBeInTheDocument();
    expect(screen.getByText(/Status: DELIVERED/)).toBeInTheDocument();
    expect(screen.getByText(/Sort: Newest/)).toBeInTheDocument();
  });

  it('calls onClearAll when Clear All button clicked', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        search="TRK123"
        status="DELIVERED"
        sortBy="date-desc"
        hasActiveFilters={true}
        {...mockHandlers}
      />
    );

    const clearAllButton = screen.getByLabelText('Clear all filters');
    await user.click(clearAllButton);

    expect(mockHandlers.onClearAll).toHaveBeenCalled();
  });

  it('does not display active filters section when hasActiveFilters is false', () => {
    render(
      <DeliveryFilters
        search=""
        status={undefined}
        sortBy={undefined}
        hasActiveFilters={false}
        {...mockHandlers}
      />
    );

    expect(screen.queryByText('Active filters:')).not.toBeInTheDocument();
  });

  it('renders all status options in dropdown', () => {
    const { container } = render(
      <DeliveryFilters
        search=""
        status={undefined}
        sortBy={undefined}
        hasActiveFilters={false}
        {...mockHandlers}
      />
    );

    const statusSelect = screen.getByLabelText('Filter by status') as HTMLSelectElement;
    const options = Array.from(statusSelect.options).map((opt) => opt.value);

    expect(options).toContain('');
    expect(options).toContain('PENDING');
    expect(options).toContain('ACCEPTED');
    expect(options).toContain('IN_TRANSIT');
    expect(options).toContain('DELIVERED');
    expect(options).toContain('CANCELLED');
  });

  it('renders all sort options in dropdown', () => {
    render(
      <DeliveryFilters
        search=""
        status={undefined}
        sortBy={undefined}
        hasActiveFilters={false}
        {...mockHandlers}
      />
    );

    const sortSelect = screen.getByLabelText('Sort by date') as HTMLSelectElement;
    const options = Array.from(sortSelect.options).map((opt) => opt.value);

    expect(options).toContain('');
    expect(options).toContain('date-desc');
    expect(options).toContain('date-asc');
  });
});
