import api from './api';

export interface RewardsBalance {
  balance: number;
  discountBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  redeemableDiscount: number;
}

export interface RewardTransaction {
  id: string;
  userId: string;
  points: number;
  type: 'earned' | 'redeemed' | 'expired';
  cashValue: number;
  description?: string;
  referenceId?: string;
  createdAt: string;
}

export interface ReferralInfo {
  referralCode: string;
  totalReferrals: number;
  pendingReferrals: number;
}

export interface ReferralEntry {
  id: string;
  referralCode: string;
  referredEmail?: string;
  status: 'pending' | 'rewarded' | 'expired';
  rewardAmount: number;
  createdAt: string;
}

export async function getRewardsBalance(): Promise<RewardsBalance> {
  const response = await api.get<RewardsBalance>('/geopay/rewards/balance');
  return response.data;
}

export async function getRewardHistory(): Promise<RewardTransaction[]> {
  const response = await api.get<RewardTransaction[]>('/geopay/rewards/history');
  return response.data;
}

export async function redeemPoints(points: number): Promise<{
  pointsRedeemed: number;
  discountPesos: number;
  newBalance: number;
  discountBalance: number;
}> {
  const response = await api.post('/geopay/rewards/redeem', { points });
  return response.data;
}

export async function consumeDiscount(discountPesos: number): Promise<{
  consumed: number;
  remainingDiscount: number;
}> {
  const response = await api.post('/geopay/rewards/consume-discount', { discountPesos });
  return response.data;
}

export async function getReferralCode(): Promise<ReferralInfo> {
  const response = await api.get<ReferralInfo>('/geopay/referral/code');
  return response.data;
}

export async function registerReferral(code: string, email?: string): Promise<{ success: boolean }> {
  const response = await api.post('/geopay/referral/register', { code, email });
  return response.data;
}

export async function getReferralHistory(): Promise<ReferralEntry[]> {
  const response = await api.get<ReferralEntry[]>('/geopay/referral/history');
  return response.data;
}
