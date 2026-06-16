const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
  try {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return envUrl
          .replace('//localhost:', `//${hostname}:`)
          .replace('//127.0.0.1:', `//${hostname}:`);
      }
    }
  } catch { /* ignore */ }
  return envUrl;
};

export const API_URL = getApiUrl();

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
