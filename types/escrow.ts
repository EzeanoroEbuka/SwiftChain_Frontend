/**
 * Represents the details of an escrow contract fetched from the blockchain.
 */
export interface EscrowDetails {
  requiredSignatures: number;
  currentSignatures: number;
  isReleased: boolean;
  signers: string[];
}

/**
 * The response structure after a successful fund release transaction.
 */
export interface ReleaseFundsResponse {
  success: boolean;
  transactionHash: string;
}