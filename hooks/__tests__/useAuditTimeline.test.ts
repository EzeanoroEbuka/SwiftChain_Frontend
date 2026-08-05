import { renderHook, waitFor } from '@testing-library/react';
import { useAuditTimeline } from '@/hooks/useAuditTimeline';
import { auditService } from '@/services/auditService';

jest.mock('@/services/auditService');

describe('useAuditTimeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch audit timeline for a delivery', async () => {
    const mockEvents = [
      {
        eventId: 'evt1',
        eventType: 'contract-created',
        description: 'Contract created',
        timestamp: '2026-06-01T10:00:00Z',
        actorId: 'actor1',
        actorAddress: 'GDDST234234',
      },
      {
        eventId: 'evt2',
        eventType: 'driver-assigned',
        description: 'Driver assigned',
        timestamp: '2026-06-01T11:00:00Z',
        actorId: 'actor2',
        actorAddress: 'GDDST234235',
      },
    ];

    (auditService.getDeliveryAuditTimeline as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        deliveryId: 'delivery123',
        events: mockEvents,
        totalCount: 2,
      },
    });

    const { result } = renderHook(() => useAuditTimeline('delivery123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toHaveLength(2);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.events[0].eventType).toBe('contract-created');
  });

  it('should not fetch when deliveryId is null', async () => {
    const { result } = renderHook(() => useAuditTimeline(null));

    expect(result.current.events).toHaveLength(0);
    expect(auditService.getDeliveryAuditTimeline).not.toHaveBeenCalled();
  });

  it('should sort events chronologically', async () => {
    const mockEvents = [
      {
        eventId: 'evt2',
        eventType: 'delivered',
        description: 'Delivered',
        timestamp: '2026-06-01T15:00:00Z',
        actorId: 'actor2',
        actorAddress: 'GDDST234235',
      },
      {
        eventId: 'evt1',
        eventType: 'contract-created',
        description: 'Contract created',
        timestamp: '2026-06-01T10:00:00Z',
        actorId: 'actor1',
        actorAddress: 'GDDST234234',
      },
    ];

    (auditService.getDeliveryAuditTimeline as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        deliveryId: 'delivery123',
        events: mockEvents,
        totalCount: 2,
      },
    });

    const { result } = renderHook(() => useAuditTimeline('delivery123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Events should be sorted chronologically
    expect(result.current.events[0].eventType).toBe('contract-created');
    expect(result.current.events[1].eventType).toBe('delivered');
  });

  it('should handle API errors', async () => {
    (auditService.getDeliveryAuditTimeline as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Failed to fetch timeline',
    });

    const { result } = renderHook(() => useAuditTimeline('delivery123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch timeline');
    expect(result.current.events).toHaveLength(0);
  });

  it('should refresh timeline', async () => {
    const mockResponse = {
      success: true,
      data: {
        deliveryId: 'delivery123',
        events: [
          {
            eventId: 'evt1',
            eventType: 'contract-created',
            description: 'Contract created',
            timestamp: '2026-06-01T10:00:00Z',
            actorId: 'actor1',
            actorAddress: 'GDDST234234',
          },
        ],
        totalCount: 1,
      },
    };

    (auditService.getDeliveryAuditTimeline as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuditTimeline('delivery123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.refresh();

    await waitFor(() => {
      expect(auditService.getDeliveryAuditTimeline).toHaveBeenCalledTimes(2);
    });
  });
});
