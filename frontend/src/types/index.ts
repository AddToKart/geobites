export type UserRole = 'customer' | 'seller' | 'rider';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'delivering'
  | 'delivered'
  | 'rejected'
  | 'cancelled';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  storeName?: string;
  businessPermit?: string;
  vehicleType?: string;
  licenseNumber?: string;
  street?: string;
  barangay?: string;
  landmark?: string;
  deliveryLat?: string | number;
  deliveryLng?: string | number;
}

export interface OperatingHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Vendor {
  id: string;
  userId: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  totalRatings: number;
  imageUrl?: string;
  isActive: boolean;
  operatingHours?: OperatingHours[];
  businessPermit?: string;
  businessPermitExpiry?: string;
  foodSafetyCert?: string;
  foodSafetyCertExpiry?: string;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  isAvailable: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  prepTimeMinutes?: number;
  allergens?: string[];
  dietaryTags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  prepTimeMinutes?: number;
}

export interface Order {
  id: string;
  customerId: string;
  vendorId: string;
  riderId?: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryFee: number;
  platformFee: number;
  deliveryAddress: string;
  street?: string;
  barangay?: string;
  landmark?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  riderLat?: number;
  riderLng?: number;
  notes?: string;
  paymentMethod: 'COD' | 'GCASH' | 'MAYA' | 'QRPH' | 'GEOPAY';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentSessionId?: string;
  items: OrderItem[];
  vendor?: Vendor;
  customer?: Pick<User, 'id' | 'name'>;
  rider?: Pick<User, 'id' | 'name'>;
  riderName?: string;
  riderPhone?: string;
  customerName?: string;
  customerPhone?: string;
  vendorPhone?: string;
  customerRating?: number;
  cancellationReason?: string;
  disputeStatus?: 'none' | 'open' | 'resolved_refunded' | 'resolved_rejected';
  prepStartTime?: string;
  prepCompleteTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemAnalytics {
  menuItemId: string;
  name: string;
  category?: string;
  orderCount: number;
  totalRevenue: number;
  avgRating?: number;
  totalQuantitySold: number;
}

export interface VendorAnalytics {
  period: 'day' | 'week' | 'month';
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  completionRate: number;
  avgPrepTimeMinutes: number;
  topItems: MenuItemAnalytics[];
  revenueByCategory: Record<string, number>;
  ordersByHour: Record<number, number>;
  ordersByDay: Record<number, number>;
}

export interface PayoutSummary {
  period: string;
  grossRevenue: number;
  platformFees: number;
  deliveryFeesCollected: number;
  netPayout: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  paidAt?: string;
  transactions: PayoutTransaction[];
}

export interface PayoutTransaction {
  id: string;
  orderId: string;
  amount: number;
  platformFee: number;
  deliveryFee: number;
  netAmount: number;
  createdAt: string;
}

export interface Rating {
  id: string;
  score: number;
  feedback?: string;
  customerName: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  type: 'percentage' | 'free_delivery' | 'bogo';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  applicableTo: string;
  applicableIds?: string[];
  isActive: boolean;
  startsAt: string;
  expiresAt?: string;
  usageLimit?: number;
  currentUsage: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order_update' | 'delivery_request' | 'rating' | 'system';
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SessionPayload {
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  };
  user: User;
}
