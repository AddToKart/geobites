export const USER_ROLES = ['customer', 'seller', 'rider'] as const;

export type UserRole = (typeof USER_ROLES)[number];
