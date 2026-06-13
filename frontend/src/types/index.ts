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
}

export interface Order {
  id: string;
  customerId: string;
  vendorId: string;
  riderId?: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryFee: number;
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
  createdAt: string;
  updatedAt: string;
}

export interface Rating {
  id: string;
  score: number;
  feedback?: string;
  customerName: string;
  createdAt: string;
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
