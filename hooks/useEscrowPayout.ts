import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { escrowService } from '@/services/escrowService';
import { useToast } from '@/hooks/useToast';

/**
 * Hook to manage escrow payout state and actions by interacting with a Soroban contract.
 *
 * @param escrowId The ID (contract address) of the escrow.
 */
export const useEscrowPayout = (escrowId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ['escrowPayout', escrowId];

  const {
    data: escrowDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => escrowService.getEscrowDetails(escrowId),
    enabled: !!escrowId, // Only run query if escrowId is provided
    staleTime: 1000 * 30, // Data is fresh for 30 seconds
  });

  const { mutate: releaseFunds, isPending: isReleasing } = useMutation({
    mutationFn: () => escrowService.releaseFunds(escrowId),
    onSuccess: (data) => {
      toast({
        title: 'Funds Released Successfully',
        description: `Transaction: ${data.transactionHash.substring(0, 10)}...`,
      });
      // Refetch the escrow details to update the UI state
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to Release Funds',
        description: err.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    },
  });

  const canRelease =
    escrowDetails &&
    !escrowDetails.isReleased &&
    escrowDetails.currentSignatures >= escrowDetails.requiredSignatures;

  return {
    isLoading: isLoading || isReleasing,
    error: error?.message || null,
    requiredSignatures: escrowDetails?.requiredSignatures ?? 0,
    currentSignatures: escrowDetails?.currentSignatures ?? 0,
    signers: escrowDetails?.signers ?? [],
    isReleased: escrowDetails?.isReleased ?? false,
    canRelease: canRelease ?? false,
    releaseFunds,
  };
};