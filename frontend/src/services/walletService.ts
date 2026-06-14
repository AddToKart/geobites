import api from './api';

export interface Wallet {
  id: string;
  customerId?: string;
  vendorId?: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: 'cash_in' | 'payment' | 'refund' | 'vendor_payout' | 'withdrawal';
  referenceId?: string;
  status: 'pending' | 'success' | 'failed';
  paymentMethod?: string;
  createdAt: string;
}

export interface VendorWithdrawal {
  id: string;
  vendorId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  accountName: string;
  accountNumber: string;
  accountType: 'bank' | 'ewallet';
  accountProvider: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getWallet(): Promise<Wallet> {
  const response = await api.get<Wallet>('/wallet/balance');
  return response.data;
}

export interface PaginatedTransactions {
  data: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
}

export async function getTransactions(page = 1, limit = 15): Promise<PaginatedTransactions> {
  const response = await api.get<PaginatedTransactions>('/wallet/transactions', {
    params: { page, limit },
  });
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

export async function getVendorWallet(): Promise<Wallet | { needsSetup: boolean }> {
  const response = await api.get<Wallet>('/wallet/vendor');
  return response.data;
}

export async function getVendorTransactions(): Promise<WalletTransaction[]> {
  const response = await api.get<WalletTransaction[]>('/wallet/vendor/transactions');
  return response.data;
}

export async function requestVendorWithdrawal(
  amount: number,
  accountDetails: {
    accountName: string;
    accountNumber: string;
    accountType: 'bank' | 'ewallet';
    accountProvider: string;
  },
): Promise<VendorWithdrawal> {
  const response = await api.post<VendorWithdrawal>('/wallet/vendor/withdraw', {
    amount,
    ...accountDetails,
  });
  return response.data;
}

export async function getVendorWithdrawals(): Promise<VendorWithdrawal[]> {
  const response = await api.get<VendorWithdrawal[]>('/wallet/vendor/withdrawals');
  return response.data;
}
