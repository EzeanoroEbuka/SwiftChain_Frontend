import { useState, useCallback } from 'react';
import { walletService } from '@/services/walletService';
import { freighterService } from '@/services/freighterService';
import { toast } from 'sonner';

export interface Signer {
  publicKey: string;
  weight: number;
  approved: boolean;
}

export interface PendingMultiSigOperation {
  operationId: string;
  transactionEnvelope: string;
  description: string;
  signaturesRequired: number;
  currentSignatures: number;
  signers: Signer[];
  createdAt: string;
  status: 'pending' | 'signed' | 'rejected' | 'expired';
  expiresAt: string;
}

export interface UseMultiSigApprovalsState {
  operations: PendingMultiSigOperation[];
  isLoading: boolean;
  error: string | null;
  isSigning: boolean;
}

export interface UseMultiSigApprovalsActions {
  fetchPendingOperations: (walletAddress: string) => Promise<void>;
  signOperation: (operation: PendingMultiSigOperation) => Promise<void>;
  refreshOperations: (walletAddress: string) => Promise<void>;
}

export type UseMultiSigApprovalsReturn = UseMultiSigApprovalsState & UseMultiSigApprovalsActions;

/**
 * Hook for managing multi-signature operations and approvals
 * Handles fetching pending operations and submitting signatures
 */
export function useMultiSigApprovals(): UseMultiSigApprovalsReturn {
  const [operations, setOperations] = useState<PendingMultiSigOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const fetchPendingOperations = useCallback(async (walletAddress: string) => {
    try {
      setIsLoading(true);
      // Yield to the event loop so callers (tests) can observe the loading state synchronously
      await Promise.resolve();
      setError(null);

      const response = await walletService.getPendingMultiSigOperations(walletAddress);

      if (!response.success) {
        setError(response.message || 'Failed to fetch pending operations');
        setOperations([]);
        return;
      }

      setOperations(response.operations || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pending operations';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOperation = useCallback(async (operation: PendingMultiSigOperation) => {
    try {
      setIsSigning(true);

      // Get the signer's public key from Freighter
      const publicKey = await freighterService.getPublicKey();

      // Sign the transaction with Freighter
      const signature = await freighterService.signTransaction(operation.transactionEnvelope);

      // Submit the signature to the backend
      const response = await walletService.signMultiSigOperation({
        operationId: operation.operationId,
        signature,
        signerPublicKey: publicKey,
      });

      if (!response.success) {
        toast.error(response.message || 'Failed to submit signature');
        return;
      }

      // Update the local operations state
      setOperations((prevOps) =>
        prevOps.map((op) => {
          if (op.operationId === operation.operationId) {
            return {
              ...op,
              currentSignatures: response.currentSignatures || op.currentSignatures,
              signers: op.signers.map((signer) =>
                signer.publicKey === publicKey ? { ...signer, approved: true } : signer
              ),
            };
          }
          return op;
        })
      );

      toast.success('Signature submitted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign operation';
      toast.error(errorMessage);
    } finally {
      setIsSigning(false);
    }
  }, []);

  const refreshOperations = useCallback(async (walletAddress: string) => {
    await fetchPendingOperations(walletAddress);
  }, [fetchPendingOperations]);

  return {
    operations,
    isLoading,
    error,
    isSigning,
    fetchPendingOperations,
    signOperation,
    refreshOperations,
  };
}
