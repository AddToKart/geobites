import api from './api';

export interface Voucher {
  id: string;
  vendorId: string;
  code: string;
  title: string;
  description?: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minOrderAmount: number;
  maxUses?: number;
  currentUses: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVoucherPayload {
  code: string;
  title: string;
  description?: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  startsAt: string;
  expiresAt: string;
  isActive?: boolean;
}

export interface VoucherValidation {
  valid: boolean;
  voucher: Voucher;
  discountAmount: number;
}

export async function getMyVouchers(): Promise<Voucher[]> {
  const response = await api.get<Voucher[]>('/vouchers/vendor');
  return response.data;
}

export async function createVoucher(payload: CreateVoucherPayload): Promise<Voucher> {
  const response = await api.post<Voucher>('/vouchers/vendor', payload);
  return response.data;
}

export async function updateVoucher(id: string, payload: Partial<CreateVoucherPayload>): Promise<Voucher> {
  const response = await api.put<Voucher>(`/vouchers/vendor/${id}`, payload);
  return response.data;
}

export async function deleteVoucher(id: string): Promise<{ success: boolean }> {
  const response = await api.delete(`/vouchers/vendor/${id}`);
  return response.data;
}

export async function getActiveVouchers(vendorId: string): Promise<Voucher[]> {
  const response = await api.get<Voucher[]>(`/vouchers/vendor/${vendorId}/active`);
  return response.data;
}

export async function validateVoucherCode(code: string, vendorId: string, orderAmount: number): Promise<VoucherValidation> {
  const response = await api.post<VoucherValidation>('/vouchers/validate', { code, vendorId, orderAmount });
  return response.data;
}
