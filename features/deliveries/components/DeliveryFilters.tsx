'use client';

import React, { useCallback, useMemo } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { DeliveryStatus } from '@/types/filters';

interface DeliveryFiltersProps {
  search?: string;
  status?: DeliveryStatus;
  sortBy?: 'date-asc' | 'date-desc';
  hasActiveFilters: boolean;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: DeliveryStatus | undefined) => void;
  onSortChange: (sort: 'date-asc' | 'date-desc' | undefined) => void;
  onClearAll: () => void;
}

const STATUS_OPTIONS: DeliveryStatus[] = ['PENDING', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function DeliveryFilters({
  search = '',
  status,
  sortBy,
  hasActiveFilters,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onClearAll,
}: DeliveryFiltersProps) {
  const searchInput = React.useRef<HTMLInputElement>(null);

  const handleSearchBlur = useCallback(() => {
    onSearchChange(searchInput.current?.value || '');
  }, [onSearchChange]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchChange((e.target as HTMLInputElement).value);
    }
  }, [onSearchChange]);

  const handleClearSearch = useCallback(() => {
    if (searchInput.current) {
      searchInput.current.value = '';
      onSearchChange('');
    }
  }, [onSearchChange]);

  const activeFiltersDisplay = useMemo(() => {
    const filters = [];
    if (search) filters.push(`Search: ${search}`);
    if (status) filters.push(`Status: ${status}`);
    if (sortBy) filters.push(`Sort: ${sortBy === 'date-desc' ? 'Newest' : 'Oldest'}`);
    return filters;
  }, [search, status, sortBy]);

  return (
    <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-6">
      {/* Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-3 mb-4">
        <div className="flex-1">
          <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search by Tracking ID
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              id="search-input"
              ref={searchInput}
              type="text"
              placeholder="e.g., TRK123456"
              defaultValue={search}
              onBlur={handleSearchBlur}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              aria-label="Search deliveries"
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex-1">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by Status
          </label>
          <div className="relative">
            <select
              id="status-filter"
              value={status || ''}
              onChange={(e) => onStatusChange(e.target.value as DeliveryStatus | undefined)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* Sort Filter */}
        <div className="flex-1">
          <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sort by Date
          </label>
          <div className="relative">
            <select
              id="sort-filter"
              value={sortBy || ''}
              onChange={(e) => onSortChange(e.target.value as 'date-asc' | 'date-desc' | undefined)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
              aria-label="Sort by date"
            >
              <option value="">No Sort</option>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active filters:</span>
          {activeFiltersDisplay.map((filter) => (
            <span
              key={filter}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
            >
              {filter}
            </span>
          ))}
          <button
            onClick={onClearAll}
            className="ml-auto text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
            aria-label="Clear all filters"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
