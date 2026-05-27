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
    street?: string;
    barangay?: string;
    landmark?: string;
    floorOrGate?: string;
    paymentMethod: 'COD' | 'GCASH' | 'MAYA' | 'QRPH';
    paymentStatus: 'pending' | 'paid' | 'failed';
    cancellationReason?: string;
    disputeReason?: string;
    disputeStatus: 'none' | 'open' | 'resolved_refunded' | 'resolved_rejected';
    estimatedDeliveryTime?: Date;
    deliveryLat?: number;
    deliveryLng?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    vendor: Vendor;
    items: OrderItem[];
    ratings: Rating[];
}
