'use client';

import { useState, useEffect, useCallback } from 'react';
import { auditService, type AuditEvent } from '@/services/auditService';

export interface UseAuditTimelineResult {
  /** Array of chronological audit events */
  events: AuditEvent[];
  /** True while fetching audit data */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Total count of events */
  totalCount: number;
  /** Refresh the audit timeline */
  refresh: () => Promise<void>;
}

/**
 * useAuditTimeline — fetches and manages audit event timeline data.
 *
 * Follows the Component → Hook → Service pattern:
 *   AuditTimeline (component) → useAuditTimeline (hook) → auditService (service)
 */
export function useAuditTimeline(deliveryId: string | null): UseAuditTimelineResult {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!deliveryId) {
      Promise.resolve().then(() => setEvents([]));
      return;
    }

    let cancelled = false;

    auditService
      .getDeliveryAuditTimeline(deliveryId)
      .then((response) => {
        if (cancelled) return;
        setIsLoading(false);
        if (response.success && response.data) {
          const sortedEvents = [...response.data.events].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setEvents(sortedEvents);
          setTotalCount(response.data.totalCount);
        } else {
          setError(response.message ?? 'Failed to fetch audit timeline');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setIsLoading(false);
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      });

    // Start loading after kicking off the request
    Promise.resolve().then(() => { if (!cancelled) setIsLoading(true); });

    return () => { cancelled = true; };
  }, [deliveryId]);

  const refresh = useCallback(async () => {
    if (!deliveryId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await auditService.getDeliveryAuditTimeline(deliveryId);
      if (response.success && response.data) {
        const sortedEvents = [...response.data.events].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setEvents(sortedEvents);
        setTotalCount(response.data.totalCount);
      } else {
        setError(response.message ?? 'Failed to fetch audit timeline');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [deliveryId]);

  return {
    events,
    isLoading,
    error,
    totalCount,
    refresh,
  };
}
