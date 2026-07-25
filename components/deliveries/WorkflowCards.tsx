'use client';

import { useMemo } from 'react';
import { useWorkflowCards } from '@/hooks/useWorkflowCards';
import type { Delivery } from '@/types/delivery';

function getStatusColor(status: string) {
  switch (status) {
    case 'DELIVERED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'IN_TRANSIT':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'ACCEPTED':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WorkflowCards() {
  const { data, isLoading, error } = useWorkflowCards();

  const cards = useMemo(() => data ?? [], [data]);

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-gray-500">Loading workflow cards...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-sm text-red-500">Error loading workflow cards: {error.message}</div>;
  }

  if (!cards.length) {
    return <div className="p-4 text-center text-sm text-gray-500">No workflow cards available.</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 p-4">
      {cards.map((delivery: Delivery) => (
        <article
          key={delivery.id}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{delivery.trackingNumber}</p>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(delivery.status)}`}>
                  {delivery.status}
                </span>
              </div>

              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p className="break-words">
                  <span className="font-medium text-gray-700 dark:text-gray-200">From:</span> {delivery.origin}
                </p>
                <p className="break-words">
                  <span className="font-medium text-gray-700 dark:text-gray-200">To:</span> {delivery.destination}
                </p>
              </div>

              {delivery.landmark ? (
                <div className="flex flex-wrap items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-800 dark:bg-amber-950/60">
                  <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-800 dark:text-amber-100">
                    Landmark
                  </span>
                  <p className="min-w-0 flex-1 break-words italic text-amber-800 dark:text-amber-200">
                    {delivery.landmark}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400 md:items-end">
              <p className="font-medium text-gray-600 dark:text-gray-300">Escrow: {delivery.escrowStatus}</p>
              {delivery.amount ? <p>Amount: {delivery.amount}</p> : null}
              <p className="text-xs">Created: {formatDate(delivery.createdAt)}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
