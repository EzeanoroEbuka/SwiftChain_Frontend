'use client';

import { useEscrowPayout } from '@/hooks/useEscrowPayout';
import { SignatureProgressBar } from './SignatureProgressBar';
import { SignerList } from './SignerList';

interface PayoutUIProps {
  escrowId: string;
}

export function PayoutUI({ escrowId }: PayoutUIProps) {
  const {
    isLoading,
    error,
    requiredSignatures,
    currentSignatures,
    signers,
    canRelease,
    releaseFunds,
  } = useEscrowPayout(escrowId);

  if (isLoading) {
    return <div aria-label="Loading payout UI">Loading escrow details...</div>;
  }

  if (error) {
    return <div role="alert" className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-lg font-semibold">Escrow Payout</h2>
      <SignatureProgressBar
        current={currentSignatures}
        required={requiredSignatures}
      />
      <SignerList signers={signers} requiredSignatures={requiredSignatures} />
      <button
        onClick={releaseFunds}
        disabled={!canRelease}
        className={`mt-6 w-full px-4 py-2 rounded-md font-semibold text-white transition-colors ${canRelease ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
      >
        Release Funds
      </button>
    </div>
  );
}