/**
 * Transaction Status Types
 * Defines blockchain transaction tracking structures for Stellar operations
 */

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CONFIRMED';

export interface TransactionResponse {
  transactionHash: string;
  status: TransactionStatus;
  timestamp: string;
  confirmations?: number;
  errorMessage?: string;
  amount?: number;
  destination?: string;
  source?: string;
  message?: string;
  stellarExplorerUrl?: string;
}

export interface TxTrackerState {
  transactionHash: string;
  status: TransactionStatus;
  message: string;
  stellarExplorerUrl: string;
}
