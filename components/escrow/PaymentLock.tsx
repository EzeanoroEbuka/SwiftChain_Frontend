'use client';

/**
 * PaymentLock — Escrow payment input component.
 *
 * Allows a user to enter an XLM amount and immediately see its NGN equivalent
 * underneath the field. A tooltip explains that the smart contract only
 * operates in XLM regardless of the displayed fiat value.
 *
 * Architecture: PaymentLock (Component) → useCurrencyConversion (Hook) → fxService → Backend
 */

import React, { useState } from 'react';
import { Info, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { Tooltip } from '@/components/ui/Tooltip';

export interface PaymentLockProps {
  /** Called with the validated XLM number when the user submits */
  onLock: (xlmAmount: number) => Promise<void> | void;
  /** Optional: pre-fill the input (e.g. from a delivery amount) */
  initialAmount?: string;
  /** Disables the form while a parent operation is in progress */
  disabled?: boolean;
}

export function PaymentLock({
  onLock,
  initialAmount = '',
  disabled = false,
}: PaymentLockProps) {
  const [xlmInput, setXlmInput] = useState<string>(initialAmount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { ngnAmount, rate, rateUpdatedAt, isLoading, isError } =
    useCurrencyConversion(xlmInput);

  // ---- Validation --------------------------------------------------------
  const parsedXlm = parseFloat(xlmInput);
  const isValidAmount =
    xlmInput.trim() !== '' && Number.isFinite(parsedXlm) && parsedXlm > 0;

  // ---- Handlers ----------------------------------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError(null);
    // Allow only numeric input with an optional decimal point
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setXlmInput(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount) return;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onLock(parsedXlm);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to lock escrow. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = disabled || isSubmitting;

  // ---- Render ------------------------------------------------------------
  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      aria-label="Lock escrow payment"
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
          <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Lock Escrow Payment
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Funds are held on the Stellar blockchain until delivery is confirmed.
          </p>
        </div>
      </div>

      {/* XLM Amount Input */}
      <div className="mb-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor="xlm-amount"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Amount (XLM)
          </label>

          {/* Tooltip — explains why only XLM is accepted */}
          <Tooltip
            placement="right"
            content="Smart contracts on the Stellar network operate strictly in XLM. The NGN value shown is for reference only and does not affect the locked amount."
          >
            <button
              type="button"
              aria-label="Why XLM only?"
              className="inline-flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 dark:hover:text-gray-300"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>

        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400"
          >
            XLM
          </span>
          <input
            id="xlm-amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={xlmInput}
            onChange={handleChange}
            disabled={isDisabled}
            autoComplete="off"
            aria-describedby="ngn-equivalent rate-info"
            className={[
              'w-full rounded-lg border py-2.5 pl-14 pr-4 text-right text-lg font-semibold',
              'placeholder:text-gray-300 dark:placeholder:text-gray-600',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              'transition-colors duration-150',
              isDisabled
                ? 'cursor-not-allowed bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-white',
              isValidAmount || xlmInput === ''
                ? 'border-gray-300 dark:border-gray-600'
                : 'border-red-400 dark:border-red-600',
            ].join(' ')}
          />
        </div>

        {/* Inline validation hint */}
        {xlmInput !== '' && !isValidAmount && (
          <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            Please enter a valid XLM amount greater than 0.
          </p>
        )}
      </div>

      {/* NGN Equivalent */}
      <div
        id="ngn-equivalent"
        aria-live="polite"
        aria-atomic="true"
        className="mb-6 min-h-[2rem] rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-800/50"
      >
        {isLoading && (
          <span className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Fetching rate…
          </span>
        )}

        {!isLoading && isError && (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            NGN equivalent unavailable
          </span>
        )}

        {!isLoading && !isError && ngnAmount && (
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              ≈ NGN equivalent
            </span>
            <span
              className="text-base font-semibold text-gray-500 dark:text-gray-400"
              aria-label={`Approximately ${ngnAmount}`}
            >
              {ngnAmount}
            </span>
          </div>
        )}

        {!isLoading && !isError && !ngnAmount && xlmInput === '' && (
          <span className="text-sm text-gray-300 dark:text-gray-600">
            Enter an amount to see the NGN equivalent
          </span>
        )}
      </div>

      {/* Rate info */}
      {rate !== null && rateUpdatedAt && (
        <p
          id="rate-info"
          className="mb-4 text-xs text-gray-400 dark:text-gray-500"
        >
          Rate: 1 XLM ={' '}
          {new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 2,
          }).format(rate)}{' '}
          · Updated{' '}
          {new Date(rateUpdatedAt).toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      {/* Submit error */}
      {submitError && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {submitError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isDisabled || !isValidAmount}
        className={[
          'w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150',
          'flex items-center justify-center gap-2',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isDisabled || !isValidAmount
            ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            : 'bg-primary text-white hover:bg-primary-dark active:scale-[0.99]',
        ].join(' ')}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Locking…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" aria-hidden="true" />
            Lock {isValidAmount ? `${xlmInput} XLM` : 'Payment'}
          </>
        )}
      </button>
    </form>
  );
}
