'use client';

import { useXLMPriceChart } from '@/hooks/useXLMPriceChart';
import { useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

/**
 * XLMPriceChart — displays real-time XLM to Fiat conversion rates with a 7/30-day trend.
 *
 * Layered Architecture:
 *   XLMPriceChart (Component) → useXLMPriceChart (Hook) → priceService (Service)
 *
 * Features:
 *   - Interactive line chart showing historical price data
 *   - Custom tooltip on hover with exact price and timestamp
 *   - Current live price with green/red percentage indicator
 *   - Toggle between 7-day and 30-day views
 */
export function XLMPriceChart() {
  const {
    currentPrice,
    percentChange,
    priceHistory,
    isLoading,
    error,
    refresh,
    setPeriodDays,
    periodDays,
  } = useXLMPriceChart();

  const [hoveredPoint, setHoveredPoint] = useState<{ price: number; timestamp: string } | null>(
    null
  );

  const isPositiveChange = (percentChange ?? 0) >= 0;
  const minPrice = priceHistory.length > 0 ? Math.min(...priceHistory.map((p) => p.price)) : 0;
  const maxPrice = priceHistory.length > 0 ? Math.max(...priceHistory.map((p) => p.price)) : 0;
  const chartHeight = 200;
  const chartWidth = 400;
  const padding = 40;

  // Calculate SVG path for the line chart
  const generatePath = () => {
    if (priceHistory.length < 2) return '';

    const range = maxPrice - minPrice || 1;
    const points = priceHistory.map((point, index) => {
      const x = (index / (priceHistory.length - 1)) * (chartWidth - padding * 2) + padding;
      const y = chartHeight - ((point.price - minPrice) / range) * (chartHeight - padding * 2) - padding;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">XLM Price Trend</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Historical conversion rate to USD
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          disabled={isLoading}
          className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
          aria-label="Refresh price data"
        >
          <RefreshCw
            className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Current Price Display */}
      {currentPrice !== null && percentChange !== null && (
        <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              ${currentPrice.toFixed(4)}
            </span>
            <div
              className={`flex items-center gap-1 rounded-full px-3 py-1 ${
                isPositiveChange
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {isPositiveChange ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-semibold">{percentChange.toFixed(2)}%</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {periodDays}-day change
          </p>
        </div>
      )}

      {/* Chart Period Toggle */}
      <div className="mb-6 flex gap-2">
        {[7, 30].map((days) => (
          <button
            key={days}
            onClick={() => void setPeriodDays(days as 7 | 30)}
            disabled={isLoading}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              periodDays === days
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {days}d
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && !priceHistory.length && (
        <div className="flex h-64 items-center justify-center">
          <div className="space-y-2 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600 dark:border-gray-600 dark:border-t-indigo-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading price data...</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {!isLoading && priceHistory.length > 0 && (
        <div className="space-y-4">
          <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800/50">
            <svg
              width="100%"
              height={chartHeight}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="overflow-visible"
            >
              {/* Grid Lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={`grid-${i}`}
                  x1={padding}
                  y1={padding + (i * (chartHeight - padding * 2)) / 4}
                  x2={chartWidth - padding}
                  y2={padding + (i * (chartHeight - padding * 2)) / 4}
                  stroke="currentColor"
                  strokeDasharray="4"
                  className="text-gray-300 dark:text-gray-600"
                  opacity="0.3"
                />
              ))}

              {/* Chart Line */}
              <path
                d={generatePath()}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-indigo-600"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {priceHistory.map((point, index) => {
                const range = maxPrice - minPrice || 1;
                const x = (index / (priceHistory.length - 1)) * (chartWidth - padding * 2) + padding;
                const y =
                  chartHeight - ((point.price - minPrice) / range) * (chartHeight - padding * 2) - padding;

                return (
                  <circle
                    key={`point-${index}`}
                    cx={x}
                    cy={y}
                    r="3"
                    className="fill-indigo-600 hover:fill-indigo-700"
                    onMouseEnter={() => setHoveredPoint({ price: point.price, timestamp: point.timestamp })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </svg>

            {/* Tooltip */}
            {hoveredPoint && (
              <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-gray-950">
                <div className="font-semibold">${hoveredPoint.price.toFixed(4)}</div>
                <div className="text-gray-300">
                  {new Date(hoveredPoint.timestamp).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* Y-axis Labels */}
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>${minPrice.toFixed(2)}</span>
            <span>${maxPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && priceHistory.length === 0 && !error && (
        <div className="flex h-64 items-center justify-center text-center">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">No price data available</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Check back later or try refreshing
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
