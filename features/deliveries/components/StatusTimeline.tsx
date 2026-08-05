'use client';

import React from 'react';
import { useStatusTimeline } from '../../../hooks/useStatusTimeline';
import { StatusEvent } from '../../../types/delivery';

interface StatusTimelineProps {
  deliveryId: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: {
    label: 'Pending',
    color: 'bg-gray-200 text-gray-700',
    icon: '⏳',
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'bg-blue-200 text-blue-700',
    icon: '✓',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    color: 'bg-yellow-200 text-yellow-700',
    icon: '📦',
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-green-200 text-green-700',
    icon: '✅',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-200 text-red-700',
    icon: '✗',
  },
};

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ deliveryId }) => {
  const { sortedEvents, currentStatusIndex, isLoading, error } = useStatusTimeline(deliveryId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-red-700">Failed to load delivery timeline</p>
      </div>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No timeline events available
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        {sortedEvents.map((event: StatusEvent, index: number) => {
          const config = statusConfig[event.status] || statusConfig.PENDING;
          const isActive = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;

          return (
            <div key={event.id} className="flex gap-4">
              {/* Timeline Node */}
              <div className="flex flex-col items-center">
                {/* Circle Node */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold transition-all ${
                    isActive ? config.color : 'bg-gray-300 text-gray-600'
                  } ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                >
                  {config.icon}
                </div>

                {/* Connecting Line */}
                {index < sortedEvents.length - 1 && (
                  <div
                    className={`w-1 h-16 mt-2 ${
                      isActive && index < currentStatusIndex
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  ></div>
                )}
              </div>

              {/* Event Content */}
              <div className="flex-1 pt-1 pb-6">
                <div className="flex flex-col gap-1">
                  <h3
                    className={`font-semibold ${
                      isActive ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {config.label}
                  </h3>

                  {/* Timestamp */}
                  <p className="text-sm text-gray-600">
                    {new Date(event.timestamp).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>

                  {/* Description */}
                  {event.description && (
                    <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Summary */}
      {sortedEvents.length > 0 && (
        <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Current Status:</span>{' '}
            {statusConfig[sortedEvents[currentStatusIndex]?.status]?.label}
          </p>
        </div>
      )}
    </div>
  );
};

export default StatusTimeline;
