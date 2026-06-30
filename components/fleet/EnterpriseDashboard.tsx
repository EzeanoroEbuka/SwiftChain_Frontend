'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DriverReputation } from './DriverReputation';
import { useFleet } from '@/hooks/useFleet';
import type { Driver, DriverStatus } from '@/types/fleet';

// ── Constants ─────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 56; // px — fixed height required by react-virtual
const TABLE_HEIGHT = 600; // px — visible viewport for the table body

const STATUS_LABEL: Record<DriverStatus, string> = {
  active: 'Active',
  on_delivery: 'On Delivery',
  idle: 'Idle',
  offline: 'Offline',
};

const STATUS_BADGE: Record<DriverStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  on_delivery: 'bg-blue-100 text-blue-700',
  idle: 'bg-amber-100 text-amber-700',
  offline: 'bg-gray-200 text-gray-500',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StickyHeader() {
  return (
    <div
      className="sticky top-0 z-10 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] border-b border-gray-200 bg-gray-50 px-4 text-xs font-semibold uppercase tracking-wide text-gray-500"
      style={{ height: ROW_HEIGHT }}
      role="row"
      aria-label="Table header"
    >
      <div className="flex items-center">Driver</div>
      <div className="flex items-center">Vehicle</div>
      <div className="flex items-center">Status</div>
      <div className="flex items-center justify-end">Active</div>
      <div className="flex items-center justify-end">Completed</div>
      <div className="flex items-center justify-end">Rating</div>
    </div>
  );
}

interface VirtualRowProps {
  driver: Driver;
  style: React.CSSProperties;
}

function VirtualRow({ driver, style }: VirtualRowProps) {
  return (
    <div
      role="row"
      style={style}
      className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center border-b border-gray-100 bg-white px-4 text-sm transition-colors hover:bg-gray-50"
    >
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{driver.name}</span>
        <span className="text-xs text-gray-400">{driver.phone}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-700">{driver.vehicleType}</span>
        <span className="text-xs text-gray-400">{driver.vehiclePlate}</span>
      </div>
      <div>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[driver.status]}`}
        >
          {STATUS_LABEL[driver.status]}
        </span>
      </div>
      <div className="text-right text-gray-700">{driver.activeDeliveries}</div>
      <div className="text-right text-gray-700">{driver.completedDeliveries}</div>
      <DriverReputation driverId={driver.id} standardRating={driver.rating} />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 p-4" aria-busy="true" aria-label="Loading fleet data">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded-md bg-gray-100"
        />
      ))}
    </div>
  );
}

function SummaryBar({
  total,
  active,
  onDelivery,
  idle,
  offline,
}: {
  total: number;
  active: number;
  onDelivery: number;
  idle: number;
  offline: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {[
        { label: 'Total', value: total, color: 'text-gray-900' },
        { label: 'Active', value: active, color: 'text-emerald-600' },
        { label: 'On Delivery', value: onDelivery, color: 'text-blue-600' },
        { label: 'Idle', value: idle, color: 'text-amber-600' },
        { label: 'Offline', value: offline, color: 'text-gray-400' },
      ].map(({ label, value, color }) => (
        <div
          key={label}
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center shadow-sm"
        >
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="mt-0.5 text-xs text-gray-500">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * EnterpriseDashboard
 *
 * Renders a virtualized fleet table capable of smoothly displaying 1,000+
 * driver rows at 60fps. Only rows visible within the viewport are mounted in
 * the DOM — off-screen rows are unmounted, keeping memory and paint cost flat
 * regardless of fleet size.
 *
 * Architecture: Component → Hook (useFleet) → Service (fleetService)
 * Data source: backend API via fleetService.getFleet()
 */
export function EnterpriseDashboard() {
  const { drivers, summary, isLoading, error, refetch } = useFleet();

  // The scrollable container ref is passed to useVirtualizer so it knows
  // which element's scroll position to observe.
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: drivers.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10, // render 10 extra rows above/below viewport for smooth scroll
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <section aria-label="Enterprise fleet dashboard" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Enterprise Fleet</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Real-time overview of all drivers and deliveries
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Summary bar — sourced from backend API via useFleet → fleetService */}
      {summary && (
        <SummaryBar
          total={summary.totalDrivers}
          active={summary.activeDrivers}
          onDelivery={summary.onDelivery}
          idle={summary.idle}
          offline={summary.offline}
        />
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Sticky header — always visible during vertical scroll */}
        <StickyHeader />

        {/* Scrollable body */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="p-6 text-center text-sm text-red-600" role="alert">
            {error}
          </div>
        ) : drivers.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No drivers found in your fleet.
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            role="rowgroup"
            aria-label="Driver rows"
            style={{ height: TABLE_HEIGHT, overflowY: 'auto' }}
          >
            {/* Total height spacer — makes the scrollbar reflect the full list */}
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualItems.map((virtualItem) => {
                const driver = drivers[virtualItem.index];
                return (
                  <VirtualRow
                    key={driver.id}
                    driver={driver}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: virtualItem.size,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Footer row count */}
        {!isLoading && !error && drivers.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
            Showing {drivers.length.toLocaleString()} driver
            {drivers.length !== 1 ? 's' : ''} · DOM renders{' '}
            {virtualItems.length} rows
          </div>
        )}
      </div>
    </section>
  );
}