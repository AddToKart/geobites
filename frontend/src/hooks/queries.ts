import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVendors, getVendorById } from "@/services/vendorService";
import type { VendorQuery } from "@/services/vendorService";
import { getOrders, getOrder, placeOrder, updateOrderStatus } from "@/services/orderService";
import type { PlaceOrderPayload } from "@/services/orderService";
import type { OrderStatus } from "@/types";
import { getWallet, getVendorWallet } from "@/services/walletService";
import { getAddresses } from "@/services/addressService";
import { getNotifications } from "@/services/notificationService";
import { getVendorMenu } from "@/services/menuService";
import { getActivePromotions } from "@/services/promotionService";
import { getVendorRatings } from "@/services/ratingService";
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
