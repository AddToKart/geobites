import { Order } from './order.entity';
import { Vendor } from './vendor.entity';
export declare class Rating {
    id: string;
    orderId: string;
    customerId: string;
    vendorId: string;
    score: number;
    feedback?: string;
    createdAt: Date;
    order: Order;
    vendor: Vendor;
}
