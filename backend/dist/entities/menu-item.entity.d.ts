import { OrderItem } from './order-item.entity';
import { Vendor } from './vendor.entity';
export declare class MenuItem {
    id: string;
    vendorId: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    imageUrl?: string;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
    vendor: Vendor;
    orderItems: OrderItem[];
}
