'use client';

import React, { useState } from 'react';
import { Lock, Check, AlertCircle, Loader } from 'lucide-react';
import { useEscrowLock } from '@/hooks/useEscrowLock';
import { useToast } from '@/hooks/useToast';

interface EscrowLockProps {
  deliveryId: string;
  amount: number;
  currency: string;
  walletAddress?: string;
  onSuccess?: (escrowId: string, transactionHash: string) => void;
  onError?: (error: string) => void;
}

type LockState = 'idle' | 'pending' | 'success' | 'error';

export function EscrowLock({
  deliveryId,
  amount,
  currency,
  walletAddress,
  onSuccess,
  onError,
}: EscrowLockProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [state, setState] = useState<LockState>('idle');
  const { isLoading, error, escrowId, transactionHash, lockEscrow, reset } =
    useEscrowLock();
  const {
    error: toastError,
    success: toastSuccess,
    loading: toastLoading,
    info: toastInfo,
  } = useToast();

  const isWalletConnected = !!walletAddress;
  const formattedAmount = amount.toFixed(2);

  const handleLockClick = () => {
    if (!isWalletConnected) {
      setState('error');
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to lock this payment.',
        variant: 'destructive',
      });
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setShowConfirmation(false);
    setState('pending');

    try {
      await lockEscrow({
        deliveryId,
        amount,
        currency,
        walletAddress: walletAddress!,
      });

      setState('success');
      toast({
        title: 'Success!',
        description: `Escrow locked! Transaction: ${transactionHash?.slice(0, 10)}...`,
      });
      onSuccess?.(escrowId!, transactionHash!);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to lock escrow';
      setState('error');
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      onError?.(errorMsg);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  const handleReset = () => {
    setState('idle');
    reset();
  };

  // Render based on state
  if (state === 'success') {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Payment Locked Successfully!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Your escrow payment has been securely locked.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 w-full mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Transaction Hash
            </p>
            <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
              {transactionHash}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Lock Another Delivery
          </button>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Locking Payment
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {error || 'An unexpected error occurred. Please try again.'}
          </p>
          <button
            onClick={() => {
              setState('idle');
              handleLockClick();
            }}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Total Cost
          </p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {formattedAmount} {currency}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            This amount will be locked in escrow until delivery is confirmed
          </p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            ✓ Your payment is protected in escrow
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            ✓ Released only upon delivery confirmation
          </p>
        </div>

        {!isWalletConnected && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ Connect your wallet to lock this payment
            </p>
          </div>
        )}

        <button
          onClick={handleLockClick}
          disabled={isLoading || !isWalletConnected}
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            isLoading
              ? 'bg-blue-500 text-white cursor-wait'
              : isWalletConnected
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Locking Payment…
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Lock Payment in Escrow
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          {isWalletConnected
            ? 'Wallet connected'
            : 'Wallet status: disconnected'}
        </p>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Confirm Escrow Lock
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You are about to lock
              <span className="font-semibold block text-lg mt-2">
                {formattedAmount} {currency}
              </span>
              in escrow. This action cannot be reversed immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Confirm Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
