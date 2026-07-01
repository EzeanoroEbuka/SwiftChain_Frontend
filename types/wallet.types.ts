export interface WalletBalance {
  available: number;
  locked: number;
  pending: number;
  total: number;
  currency: string;
}

export interface BalanceCheckResult {
  hasSufficientBalance: boolean;
  balance: WalletBalance;
  requiredAmount: number;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'send' | 'receive' | 'swap';
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  hash?: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}