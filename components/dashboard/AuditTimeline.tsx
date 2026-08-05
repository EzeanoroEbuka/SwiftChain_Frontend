'use client';

import { useAuditTimeline } from '@/hooks/useAuditTimeline';
import { auditService } from '@/services/auditService';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface AuditTimelineProps {
  /** The delivery ID to show the audit timeline for */
  deliveryId: string | null;
  /** Optional callback when timeline is refreshed */
  onRefresh?: () => void;
}

/**
 * AuditTimeline — displays a vertical chronological timeline of delivery events.
 *
 * Layered Architecture:
 *   AuditTimeline (Component) → useAuditTimeline (Hook) → auditService (Service)
 *
 * Features:
 *   - Vertical timeline UI with connecting lines and status icons
 *   - Events rendered chronologically
 *   - Exact timestamps and actor addresses for each event
 *   - Color-coded status indicators
 */
export function AuditTimeline({ deliveryId, onRefresh }: AuditTimelineProps) {
  const { events, isLoading, error, totalCount, refresh } = useAuditTimeline(deliveryId);

  const handleRefresh = async () => {
    await refresh();
    onRefresh?.();
  };

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Timeline</h2>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Chronological record of all actions ({totalCount})
          </p>
        </div>
        <button
          onClick={() => void handleRefresh()}
          disabled={isLoading || !deliveryId}
          className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
          aria-label="Refresh timeline"
        >
          <RefreshCw
            className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && events.length === 0 && (
        <div className="flex h-64 items-center justify-center">
          <div className="space-y-2 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600 dark:border-gray-600 dark:border-t-indigo-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading timeline...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && events.length === 0 && !error && (
        <div className="flex h-40 items-center justify-center text-center">
          <div>
            {deliveryId ? (
              <>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  No events yet
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Timeline events will appear here as actions are taken
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Select a delivery
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Timeline will display once a delivery is selected
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      {events.length > 0 && (
        <div className="space-y-0">
          {events.map((event, index) => {
            const isLast = index === events.length - 1;
            const { icon, color } = auditService.getEventIcon(event.eventType);
            const eventDate = new Date(event.timestamp);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedTime = eventDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={event.eventId} className="flex gap-4 pb-6">
                {/* Timeline Line and Dot */}
                <div className="relative flex flex-col items-center">
                  {/* Vertical Line */}
                  {!isLast && (
                    <div className="absolute left-1/2 top-12 h-6 w-0.5 -translate-x-1/2 bg-gray-200 dark:bg-gray-700" />
                  )}

                  {/* Status Circle */}
                  <div
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-white ${color}`}
                  >
                    <span className="text-sm font-bold">{icon}</span>
                  </div>
                </div>

                {/* Event Content */}
                <div className="flex-1 pt-1">
                  {/* Event Title */}
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {event.description}
                  </h3>

                  {/* Event Type Badge */}
                  <div className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {event.eventType.replace('-', ' ').toUpperCase()}
                  </div>

                  {/* Timestamp */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <time dateTime={event.timestamp}>
                      {formattedDate} at {formattedTime}
                    </time>
                  </div>

                  {/* Actor Information */}
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Actor ID:</span>{' '}
                      <span className="font-mono text-gray-600 dark:text-gray-400">{event.actorId}</span>
                    </p>
                    <p className="truncate text-xs text-gray-700 dark:text-gray-300" title={event.actorAddress}>
                      <span className="font-semibold">Address:</span>{' '}
                      <span className="font-mono text-gray-600 dark:text-gray-400">
                        {event.actorAddress.slice(0, 12)}…{event.actorAddress.slice(-12)}
                      </span>
                    </p>
                  </div>

                  {/* Additional Metadata */}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                        View Details
                      </summary>
                      <pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Footer */}
      {events.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Showing {events.length} of {totalCount} events
          </p>
        </div>
      )}
    </div>
  );
}
