import { renderHook, act } from '@testing-library/react';
import { useDeliveryFilters } from '@/features/deliveries/hooks';
import { useRouter, useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('useDeliveryFilters', () => {
  const mockRouter = { push: jest.fn() };
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('initializes with empty filters', () => {
    const { result } = renderHook(() => useDeliveryFilters());

    expect(result.current.search).toBeUndefined();
    expect(result.current.status).toBeUndefined();
    expect(result.current.sortBy).toBeUndefined();
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('reads search from URL params', () => {
    mockSearchParams.set('search', 'TRK123');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    const { result } = renderHook(() => useDeliveryFilters());

    expect(result.current.search).toBe('TRK123');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('reads status from URL params', () => {
    mockSearchParams.set('status', 'DELIVERED');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    const { result } = renderHook(() => useDeliveryFilters());

    expect(result.current.status).toBe('DELIVERED');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('reads sortBy from URL params', () => {
    mockSearchParams.set('sortBy', 'date-desc');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    const { result } = renderHook(() => useDeliveryFilters());

    expect(result.current.sortBy).toBe('date-desc');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('updates search filter and pushes to URL', () => {
    const { result } = renderHook(() => useDeliveryFilters());

    act(() => {
      result.current.updateFilters({ search: 'TRK456' });
    });

    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('search=TRK456'), {
      scroll: false,
    });
  });

  it('updates status filter and pushes to URL', () => {
    const { result } = renderHook(() => useDeliveryFilters());

    act(() => {
      result.current.updateFilters({ status: 'IN_TRANSIT' });
    });

    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('status=IN_TRANSIT'), {
      scroll: false,
    });
  });

  it('clears individual filters', () => {
    mockSearchParams.set('search', 'TRK123');
    mockSearchParams.set('status', 'DELIVERED');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    const { result } = renderHook(() => useDeliveryFilters());

    act(() => {
      result.current.updateFilters({ search: undefined });
    });

    const pushCall = mockRouter.push.mock.calls[0][0];
    expect(pushCall).not.toContain('search=');
    expect(pushCall).toContain('status=DELIVERED');
  });

  it('clears all filters', () => {
    mockSearchParams.set('search', 'TRK123');
    mockSearchParams.set('status', 'DELIVERED');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    const { result } = renderHook(() => useDeliveryFilters());

    act(() => {
      result.current.clearFilters();
    });

    expect(mockRouter.push).toHaveBeenCalledWith('?', { scroll: false });
  });

  it('detects hasActiveFilters correctly', () => {
    const emptyParams = new URLSearchParams();
    (useSearchParams as jest.Mock).mockReturnValue(emptyParams);

    const { result: emptyResult } = renderHook(() => useDeliveryFilters());
    expect(emptyResult.current.hasActiveFilters).toBe(false);

    const activeParams = new URLSearchParams('search=TRK');
    (useSearchParams as jest.Mock).mockReturnValue(activeParams);

    const { result: activeResult } = renderHook(() => useDeliveryFilters());
    expect(activeResult.current.hasActiveFilters).toBe(true);
  });

  it('handles multiple filter updates', () => {
    const { result } = renderHook(() => useDeliveryFilters());

    act(() => {
      result.current.updateFilters({
        search: 'TRK789',
        status: 'PENDING',
        sortBy: 'date-asc',
      });
    });

    const pushCall = mockRouter.push.mock.calls[0][0];
    expect(pushCall).toContain('search=TRK789');
    expect(pushCall).toContain('status=PENDING');
    expect(pushCall).toContain('sortBy=date-asc');
  });
});
