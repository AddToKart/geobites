export declare const ORDER_STATUSES: readonly ["pending", "accepted", "preparing", "ready_for_pickup", "picked_up", "delivering", "delivered", "rejected", "cancelled"];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
