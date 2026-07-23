'use client';

import { ChevronDown, MapPin, Package, Truck, DollarSign, Calendar } from 'lucide-react';
import { Delivery } from '@/types/delivery';

interface ExpandableDeliveryRowProps {
  delivery: Delivery;
  isExpanded: boolean;
  onToggle: (deliveryId: string) => void;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  IN_TRANSIT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  DELIVERED: 'bg-success text-white dark:bg-green-900 dark:text-green-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const escrowStatusColors: Record<string, string> = {
  LOCKED: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  RELEASED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REFUNDED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  NOT_LOCKED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  DISPUTED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

/**
 * ExpandableDeliveryRow Component
 * 
 * Displays delivery information in a collapsible row format with:
 * - Basic info when collapsed (tracking number, route, status)
 * - Detailed info when expanded (driver, escrow, package details)
 * - Responsive design for mobile and desktop
 */
export function ExpandableDeliveryRow({
  delivery,
  isExpanded,
  onToggle,
}: ExpandableDeliveryRowProps) {
  const handleToggle = () => {
    onToggle(delivery.id);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      {/* Main Row */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-200">
        {/* Collapsed View */}
        <button
          onClick={handleToggle}
          className="w-full text-left"
          aria-expanded={isExpanded}
          aria-label={`Toggle details for delivery ${delivery.trackingNumber}`}
        >
          <div className="p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {/* Left Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-2 md:gap-0 md:flex-row md:items-center md:justify-between flex-1">
                {/* Tracking & Status */}
                <div className="flex-1">
                  <p className="font-semibold text-lg text-primary-dark dark:text-primary-light truncate">
                    {delivery.trackingNumber}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {delivery.origin} ➔ {delivery.destination}
                  </p>
                </div>

                {/* Status Badges - Mobile Stack, Desktop Row */}
                <div className="flex flex-wrap gap-2 mt-2 md:mt-0 md:ml-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[delivery.status] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {delivery.status}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${escrowStatusColors[delivery.escrowStatus] || 'bg-gray-100 text-gray-800'}`}
                  >
                    Escrow: {delivery.escrowStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Expand Button */}
            <div className="ml-4 flex-shrink-0">
              <ChevronDown
                className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Driver Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base text-primary-dark dark:text-primary-light flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Driver Details
                </h3>
                {delivery.driver ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Name</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {delivery.driver.name}
                      </p>
                    </div>
                    {delivery.driver.email && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Email</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 break-all">
                          {delivery.driver.email}
                        </p>
                      </div>
                    )}
                    {delivery.driver.phone && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Phone</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {delivery.driver.phone}
                        </p>
                      </div>
                    )}
                    {delivery.driver.rating !== undefined && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Rating</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {'⭐'.repeat(Math.floor(delivery.driver.rating))} ({delivery.driver.rating.toFixed(1)}/5)
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No driver assigned yet</p>
                )}
              </div>

              {/* Escrow & Payment Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base text-primary-dark dark:text-primary-light flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Payment & Escrow
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Escrow Status</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {delivery.escrowStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Amount</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {delivery.currency || 'USD'} {delivery.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Package Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base text-primary-dark dark:text-primary-light flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Package Details
                </h3>
                <div className="space-y-2 text-sm">
                  {delivery.packageDescription && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Description</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {delivery.packageDescription}
                      </p>
                    </div>
                  )}
                  {delivery.weight && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Weight</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {delivery.weight} kg
                      </p>
                    </div>
                  )}
                  {delivery.estimatedDeliveryTime && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Estimated Delivery</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(delivery.estimatedDeliveryTime)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base text-primary-dark dark:text-primary-light flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Timeline
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Created</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(delivery.createdAt)}
                    </p>
                  </div>
                  {delivery.completedAt && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Completed</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(delivery.completedAt)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(delivery.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Map Section */}
            <div className="mt-6 space-y-3 border-t border-gray-200 dark:border-gray-600 pt-6">
              <h3 className="font-semibold text-base text-primary-dark dark:text-primary-light flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Locations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Pickup Location
                  </p>
                  <p className="text-gray-900 dark:text-gray-100">{delivery.origin}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Delivery Location
                  </p>
                  <p className="text-gray-900 dark:text-gray-100">{delivery.destination}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}