import { OrderItem } from './order-item.entity';
import { Rating } from './rating.entity';
import { Vendor } from './vendor.entity';
export declare class Order {
    id: string;
    customerId: string;
    vendorId: string;
    riderId?: string;
    status: 'pending' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'delivering' | 'delivered' | 'rejected' | 'cancelled';
    totalAmount: number;
    deliveryAddress: string;
    deliveryLat?: number;
    deliveryLng?: number;
    riderLat?: number;
    riderLng?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    vendor: Vendor;
    items: OrderItem[];
    ratings: Rating[];
}
