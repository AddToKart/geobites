export const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const AUTH_BASE_URL = API_URL.replace(/\/api$/, '');

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  delivering: 'Delivering',
  delivered: 'Delivered',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};
