import { MenuItem } from './menu-item.entity';
import { Order } from './order.entity';
import { Promotion } from './promotion.entity';
import { Rating } from './rating.entity';
import { Favorite } from './favorite.entity';
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
    businessPermit?: string;
    businessPermitExpiry?: string;
    foodSafetyCert?: string;
    foodSafetyCertExpiry?: string;
    openTime?: string;
    closeTime?: string;
    operatingHours?: Array<{
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        isClosed: boolean;
    }>;
    commissionRate: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    menuItems: MenuItem[];
    orders: Order[];
    ratings: Rating[];
    promotions: Promotion[];
    favorites: Favorite[];
}
