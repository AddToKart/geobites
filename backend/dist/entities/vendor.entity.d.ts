import { MenuItem } from './menu-item.entity';
import { Order } from './order.entity';
import { Rating } from './rating.entity';
export declare class Vendor {
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
    createdAt: Date;
    updatedAt: Date;
    menuItems: MenuItem[];
    orders: Order[];
    ratings: Rating[];
}
