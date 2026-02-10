export interface Wallet {
  id: string;
  userId: string;
  address: string;
  balance: string;
  stakedAmount: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'REWARD_POST'
  | 'REWARD_ENGAGEMENT'
  | 'STAKE'
  | 'UNSTAKE'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ICO_PURCHASE';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: string;
  description?: string;
  txHash?: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface StakeInfo {
  id: string;
  walletId: string;
  amount: string;
  lockPeriod: number;
  apy: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN';
}

export interface StakeInput {
  amount: string;
  lockPeriod: 30 | 60 | 90 | 180 | 365;
}
