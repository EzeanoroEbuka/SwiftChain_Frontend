'use client';

import { useDeliveries } from '@/hooks/useDeliveries';
import { useDeliveryFilters } from '@/features/deliveries/hooks';
import { DeliveryFilters } from '@/features/deliveries/components';

export function DeliveryList() {
  const { search, status, sortBy, hasActiveFilters, updateFilters, clearFilters } = useDeliveryFilters();
  const { data, isLoading, error } = useDeliveries({ search, status, sortBy });

  if (isLoading) return <div className="text-primary text-center p-4">Loading deliveries...</div>;
  if (error) return <div className="text-secondary-dark text-center p-4">Error fetching deliveries: {error.message}</div>;

  const getStatusColor = (status: string) => {
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
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-primary-dark dark:text-primary-light">Active Deliveries</h2>
      
      {/* Filter Controls */}
      <DeliveryFilters
        search={search}
        status={status}
        sortBy={sortBy}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={(newSearch) => updateFilters({ search: newSearch })}
        onStatusChange={(newStatus) => updateFilters({ status: newStatus })}
        onSortChange={(newSort) => updateFilters({ sortBy: newSort })}
        onClearAll={clearFilters}
      />

      {/* Deliveries List */}
      {data && data.length > 0 ? (
        <ul className="space-y-4">
          {data.map((del) => (
            <li
              key={del.id}
              className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex flex-col md:flex-row md:justify-between md:items-center border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-1 mb-4 md:mb-0 min-w-0">
                <p className="font-semibold text-lg text-primary-dark dark:text-primary-light">{del.trackingNumber}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 break-words">{del.origin} ➔ {del.destination}</p>
                {del.landmark ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      Landmark
                    </span>
                    <p className="text-sm italic text-gray-600 dark:text-gray-300 break-words">
                      {del.landmark}
                    </p>
                  </div>
                ) : null}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Created: {formatDate(del.createdAt)}
                </p>
              </div>
              <div className="flex flex-col md:items-end gap-3">
                <div className="flex gap-2 items-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(del.status)}`}>
                    {del.status}
                  </span>
                  {del.amount && (
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {del.amount}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Escrow: {del.escrowStatus}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {hasActiveFilters ? 'No deliveries match your filters.' : 'No deliveries found.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-primary hover:text-primary-dark dark:text-primary-light font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
