import api from './api';

export interface Wallet {
  id: string;
  customerId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: 'cash_in' | 'payment' | 'refund';
  referenceId?: string;
  status: 'pending' | 'success' | 'failed';
  paymentMethod?: string;
  createdAt: string;
}

export async function getWallet(): Promise<Wallet> {
  const response = await api.get<Wallet>('/wallet/balance');
  return response.data;
}

export async function getTransactions(): Promise<WalletTransaction[]> {
  const response = await api.get<WalletTransaction[]>('/wallet/transactions');
  return response.data;
}

export async function initiateCashIn(
  amount: number,
  paymentMethod: 'GCASH' | 'MAYA' | 'QRPH',
): Promise<{ transactionId: string; checkoutUrl: string; status: string }> {
  const response = await api.post<{ transactionId: string; checkoutUrl: string; status: string }>(
    '/wallet/cash-in',
    { amount, paymentMethod },
  );
  return response.data;
}
