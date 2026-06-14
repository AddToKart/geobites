import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVendors, getVendorById } from "@/services/vendorService";
import type { VendorQuery } from "@/services/vendorService";
import { getOrders, getOrder, placeOrder, updateOrderStatus } from "@/services/orderService";
import type { PlaceOrderPayload } from "@/services/orderService";
import type { OrderStatus } from "@/types";
import { getWallet, getVendorWallet, getTransactions, getVendorTransactions, getVendorWithdrawals } from "@/services/walletService";
import { getAddresses } from "@/services/addressService";
import { getNotifications } from "@/services/notificationService";
import { getVendorMenu } from "@/services/menuService";
import { getActivePromotions } from "@/services/promotionService";
import { getVendorRatings } from "@/services/ratingService";
import { getFavorites, addFavorite, removeFavorite, isFavorite } from "@/services/favoritesService";
import { getRewardsBalance, getRewardHistory, redeemPoints, consumeDiscount, getReferralCode, getReferralHistory, registerReferral } from "@/services/geopayService";
import { toast } from "sonner";

export function useVendors(query?: VendorQuery) {
  return useQuery({
    queryKey: ["vendors", query],
    queryFn: () => getVendors(query),
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ["vendors", id],
    queryFn: () => getVendorById(id),
    enabled: !!id,
  });
}

export function useOrders(params?: { status?: OrderStatus; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => getOrders(params),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PlaceOrderPayload) => placeOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to place order");
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, cancellationReason }: { id: string; status: OrderStatus; cancellationReason?: string }) =>
      updateOrderStatus(id, status, cancellationReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: () => getWallet(),
  });
}

export function useVendorWallet() {
  return useQuery({
    queryKey: ["wallet", "vendor"],
    queryFn: () => getVendorWallet(),
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: () => getTransactions(),
  });
}

export function useVendorTransactions() {
  return useQuery({
    queryKey: ["wallet", "vendor", "transactions"],
    queryFn: () => getVendorTransactions(),
  });
}

export function useVendorWithdrawals() {
  return useQuery({
    queryKey: ["wallet", "vendor", "withdrawals"],
    queryFn: () => getVendorWithdrawals(),
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: () => getAddresses(),
  });
}

export function useVendorMenu(vendorId: string) {
  return useQuery({
    queryKey: ["menu", vendorId],
    queryFn: () => getVendorMenu(vendorId),
    enabled: !!vendorId,
  });
}

export function useActivePromotions(vendorId: string) {
  return useQuery({
    queryKey: ["promotions", "active", vendorId],
    queryFn: () => getActivePromotions(vendorId),
    enabled: !!vendorId,
  });
}

export function useVendorRatings(vendorId: string) {
  return useQuery({
    queryKey: ["ratings", vendorId],
    queryFn: () => getVendorRatings(vendorId),
    enabled: !!vendorId,
  });
}

export function useNotifications(params?: { unreadOnly?: boolean; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => getNotifications(params),
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: getFavorites,
  });
}

export function useIsFavorite(vendorId: string) {
  return useQuery({
    queryKey: ["favorites", vendorId],
    queryFn: () => isFavorite(vendorId),
    enabled: !!vendorId,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendorId: string) => addFavorite(vendorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Added to favorites");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendorId: string) => removeFavorite(vendorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Removed from favorites");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// GeoPay Rewards
export function useRewardsBalance() {
  return useQuery({
    queryKey: ["geopay", "rewards"],
    queryFn: getRewardsBalance,
  });
}

export function useRewardHistory() {
  return useQuery({
    queryKey: ["geopay", "rewards", "history"],
    queryFn: getRewardHistory,
  });
}

export function useRedeemPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (points: number) => redeemPoints(points),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geopay", "rewards"] });
      toast.success("Points redeemed as discount!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useConsumeDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (discountPesos: number) => consumeDiscount(discountPesos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geopay", "rewards"] });
      toast.success("Discount applied!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// GeoPay Referrals
export function useReferralCode() {
  return useQuery({
    queryKey: ["geopay", "referral"],
    queryFn: getReferralCode,
  });
}

export function useReferralHistory() {
  return useQuery({
    queryKey: ["geopay", "referral", "history"],
    queryFn: getReferralHistory,
  });
}

export function useRegisterReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, email }: { code: string; email?: string }) => registerReferral(code, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geopay", "referral"] });
      toast.success("Referral code applied!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}


