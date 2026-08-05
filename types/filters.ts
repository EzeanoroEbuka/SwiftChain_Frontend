/**
 * Filter type definitions for delivery list
 */

export type DeliveryStatus = 'PENDING' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface DeliveryFilterParams {
  search?: string;
  status?: DeliveryStatus;
  sortBy?: 'date-asc' | 'date-desc';
}

export interface FilterState extends DeliveryFilterParams {
  hasActiveFilters: boolean;
}
