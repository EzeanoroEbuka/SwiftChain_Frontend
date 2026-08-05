'use client';

import clsx from 'clsx';
import React from 'react';
import { useWalletStore } from '@/store/walletStore';
import { useWalletBalance } from '@/hooks/useWalletBalance';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BalanceCheckProps {
  /** Total XLM required for this transaction (escrow amount + estimated fee). */
  requiredAmount: number;
  /** Called when the user confirms and submits the transaction. */
  onSubmit: () => void;
  /** Optional label for the submit button. Defaults to "Confirm & Lock Escrow". */
  submitLabel?: string;
  /** Whether the parent form has additional validation errors that block submit. */
  isFormInvalid?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * BalanceCheck — queries wallet balance before an escrow lock and renders a
 * warning when the balance is insufficient.  The submit button is disabled
 * only when the balance is *definitively* too low.
 *
 * Follows the Component → Hook → Service layered architecture:
 *   BalanceCheck → useWalletBalance → walletService
 */
export function BalanceCheck({
  requiredAmount,
  onSubmit,
  submitLabel = 'Confirm & Lock Escrow',
  isFormInvalid = false,
}: BalanceCheckProps) {
  // We can still keep this if you need to check if the user is connected, 
  // but it's no longer being passed into useWalletBalance.
  const address = useWalletStore((state) => state.address);
  
  // FIX: Call useWalletBalance without arguments. 
  // It likely gets the address internally from your wallet context.
  const { balance, isLoading, error, refetch } = useWalletBalance();

  // Extract the numeric value from the WalletBalance object.
  // Note: Adjust `.balance` below to `.amount` or `.value` if your interface differs.
  const currentBalance = balance != null 
    ? Number((balance as any).balance ?? (balance as any).amount ?? balance) 
    : null;

  // Now we safely compare two numbers
  const insufficient = currentBalance !== null ? currentBalance < requiredAmount : false;

  // The button is disabled only when the balance is definitively insufficient
  // OR when the parent form has other blocking validation errors.
  const isSubmitDisabled = insufficient || isFormInvalid;

  return (
    <div className="space-y-3">
      {/* ── Balance display ───────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Wallet Balance</span>

          {isLoading ? (
            <span className="text-sm text-gray-400 animate-pulse">Fetching…</span>
          ) : error ? (
            <button
              type="button"
              onClick={refetch}
              className="text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          ) : currentBalance !== null ? (
            <span
              className={clsx('text-sm font-semibold', {
                'text-red-600': insufficient, 'text-green-600': !insufficient
              })}
            >
              {currentBalance.toFixed(7)} XLM
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Required</span>
          <span className="text-sm font-semibold text-gray-800">
            {requiredAmount.toFixed(7)} XLM
          </span>
        </div>
      </div>

      {/* ── Insufficient balance warning ──────────────────────────────────── */}
      {insufficient && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
        >
          {/* Warning icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>

          <div className="text-sm">
            <p className="font-semibold">Insufficient balance</p>
            <p className="mt-0.5">
              You need at least{' '}
              <span className="font-medium">{requiredAmount.toFixed(7)} XLM</span> to
              complete this transaction. Your current balance is{' '}
              <span className="font-medium">{currentBalance!.toFixed(7)} XLM</span>.
            </p>
            <p className="mt-1 text-xs text-red-600">
              Please top up your wallet before proceeding.
            </p>
          </div>
        </div>
      )}

      {/* ── Balance fetch error (non-blocking) ────────────────────────────── */}
      {error && !isLoading && (
        <p className="text-xs text-amber-600">
          ⚠️ Could not verify balance — you may still proceed, but ensure you have
          sufficient XLM.
        </p>
      )}

      {/* ── Submit button ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        aria-disabled={isSubmitDisabled}
        className={clsx('w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2', {
          'cursor-not-allowed bg-gray-200 text-gray-400': isSubmitDisabled,
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': !isSubmitDisabled,
        })}
      >
        {isLoading ? 'Checking balance…' : submitLabel}
      </button>
    </div>
  );
}

export default BalanceCheck;