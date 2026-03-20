export const NOTIFICATION_TYPES = [
  'order_update',
  'delivery_request',
  'rating',
  'system',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
