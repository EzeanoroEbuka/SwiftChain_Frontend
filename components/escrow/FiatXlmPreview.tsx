'use client';

/**
 * FiatXlmPreview — Payment preview with FX rate slippage warning.
 *
 * Displays a preview of the payment with real-time FX rate monitoring.
 * Shows warning if slippage exceeds 2%, and requires explicit acknowledgment
 * if slippage exceeds 5%.
 *
 * The component blocks submission if critical slippage is detected but not acknowledged.
 *
 * Architecture: FiatXlmPreview (Component) → useFiatXlmSlippage (Hook) →
 *              fiatXlmSlippageService → fxService → Backend
 */

import React, { useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useFiatXlmSlippage } from '@/hooks/useFiatXlmSlippage';
import { formatNgn } from '@/services/fxService';

export interface FiatXlmPreviewProps {
  /** The XLM amount being paid */
  xlmAmount: number;
  /** The NGN equivalent at the time of quote */
  quotedNgnAmount: number;
  /** Current NGN rate per XLM */
  currentRate: number | null;
  /** Callback when the user confirms the payment */
  onConfirm: () => Promise<void> | void;
  /** Callback when the user cancels */
  onCancel: () => void;
  /** Whether the submit is in progress */
  isSubmitting?: boolean;
  /** Optional label for the button */
  confirmLabel?: string;
  cancelLabel?: string;
}

export function FiatXlmPreview({
  xlmAmount,
  quotedNgnAmount,
  currentRate,
  onConfirm,
  onCancel,
  isSubmitting = false,
  confirmLabel = 'Confirm Payment',
  cancelLabel = 'Cancel',
}: FiatXlmPreviewProps) {
  const slippage = useFiatXlmSlippage();

  // Initialize quote tracking when component mounts or rate changes
  useEffect(() => {
    if (currentRate !== null) {
      const quotedRate = quotedNgnAmount / xlmAmount;
      slippage.startQuote(quotedRate);
    }

    return () => {
      slippage.stopQuote();
    };
  }, [xlmAmount, quotedNgnAmount, currentRate, slippage]);

  // ---- Computed values --------------------------------------------------------
  const rateChanged = slippage.slippage !== null;
  const slippagePercent = slippage.slippage?.slippagePercent ?? 0;
  const rateDirection = slippagePercent > 0 ? 'up' : 'down';
  const rateMovementColor =
    rateDirection === 'up'
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';

  // Current NGN value based on latest rate
  const currentNgnAmount =
    currentRate !== null && xlmAmount > 0 ? xlmAmount * currentRate : null;

  // Difference in NGN
  const ngnDifference =
    currentNgnAmount !== null ? currentNgnAmount - quotedNgnAmount : null;

  // Whether to block submission
  const isBlockedBySlippage =
    slippage.requiresAcknowledgment && !slippage.isAcknowledged;

  const isDisabled = isSubmitting || isBlockedBySlippage || slippage.isLoadingRate;

  // ---- Render ----------------------------------------------------------------
  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
          <AlertCircle className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Payment Confirmation
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Review before confirming the payment
          </p>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
        {/* XLM Amount */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {xlmAmount.toFixed(2)} XLM
          </span>
        </div>

        {/* Quoted NGN */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Quoted Rate
          </span>
          <div>
            <div className="text-right font-semibold text-gray-900 dark:text-white">
              {formatNgn(quotedNgnAmount)}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              @{' '}
              {new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(quotedNgnAmount / xlmAmount)}
              {' '}per XLM
            </div>
          </div>
        </div>

        {/* Current NGN (if rate changed) */}
        {rateChanged && currentNgnAmount !== null && (
          <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Current Rate
            </span>
            <div className="text-right">
              <div className={`font-semibold ${rateMovementColor}`}>
                {formatNgn(currentNgnAmount)}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                @{' '}
                {new Intl.NumberFormat('en-NG', {
                  style: 'currency',
                  currency: 'NGN',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(currentRate!)}
                {' '}per XLM
              </div>
            </div>
          </div>
        )}

        {/* Difference indicator */}
        {ngnDifference !== null && ngnDifference !== 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Difference
            </span>
            <div className="flex items-center gap-2">
              {rateDirection === 'up' ? (
                <TrendingUp className={`h-4 w-4 ${rateMovementColor}`} aria-hidden="true" />
              ) : (
                <TrendingDown className={`h-4 w-4 ${rateMovementColor}`} aria-hidden="true" />
              )}
              <span className={`font-semibold ${rateMovementColor}`}>
                {ngnDifference > 0 ? '+' : ''}{formatNgn(ngnDifference)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Warning Section — volatile slippage (>2%) */}
      {slippage.isVolatile && !slippage.requiresAcknowledgment && (
        <div
          role="alert"
          className="mb-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-500" aria-hidden="true" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold">FX Rate Volatility Detected</p>
            <p className="mt-1 text-xs">
              The NGN/XLM rate has shifted{' '}
              <span className="font-semibold">
                {Math.abs(slippagePercent).toFixed(2)}%
              </span>
              {' '}since your quote. Please review the updated rate.
            </p>
          </div>
        </div>
      )}

      {/* Critical Section — critical slippage (>5%) */}
      {slippage.requiresAcknowledgment && (
        <div
          role="alert"
          className="mb-4 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
          <div className="flex-1 text-sm text-red-800 dark:text-red-200">
            <p className="font-semibold">⚠️ High FX Rate Volatility</p>
            <p className="mt-1 text-xs">
              The NGN/XLM rate has shifted more than{' '}
              <span className="font-semibold">
                {Math.abs(slippagePercent).toFixed(2)}%
              </span>
              . This is a significant change. You must acknowledge this volatility
              before proceeding.
            </p>

            {/* Acknowledgment Checkbox */}
            <div className="mt-3 flex items-start gap-2">
              <input
                id="volatility-ack"
                type="checkbox"
                checked={slippage.isAcknowledged}
                onChange={(e) => slippage.setAcknowledged(e.target.checked)}
                disabled={isSubmitting}
                className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-red-600 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Acknowledge FX rate volatility"
              />
              <label
                htmlFor="volatility-ack"
                className={`text-xs cursor-pointer select-none ${
                  isSubmitting ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                I acknowledge the rate volatility and accept the current rate
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {slippage.isLoadingRate && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Checking current rates…
        </div>
      )}

      {/* Success State */}
      {slippage.isAcknowledged && slippage.requiresAcknowledgment && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Volatility acknowledged. Ready to proceed.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className={[
            'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150',
            'border border-gray-300 dark:border-gray-600',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            isSubmitting
              ? 'cursor-not-allowed bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
          ].join(' ')}
        >
          {cancelLabel}
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isDisabled}
          className={[
            'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150',
            'flex items-center justify-center gap-2',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            isDisabled
              ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
              : 'bg-primary text-white hover:bg-primary-dark active:scale-[0.99]',
          ].join(' ')}
          aria-label={isDisabled ? 'Please acknowledge volatility to confirm' : confirmLabel}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Processing…
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>

      {/* Help text when blocked */}
      {isBlockedBySlippage && (
        <p className="mt-3 text-center text-xs text-red-600 dark:text-red-400">
          Please acknowledge the high volatility to proceed.
        </p>
      )}
    </div>
  );
}
