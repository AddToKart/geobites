import { Repository } from 'typeorm';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItem } from '../entities/menu-item.entity';
import { Vendor } from '../entities/vendor.entity';
export declare class MenuService {
    private readonly menuRepository;
    private readonly vendorRepository;
    constructor(menuRepository: Repository<MenuItem>, vendorRepository: Repository<Vendor>);
    findVendorMenu(vendorId: string): Promise<MenuItem[]>;
    searchAcrossVendors(query: string, filters?: {
        category?: string;
        priceMin?: number;
        priceMax?: number;
    }): Promise<{
        vendor: {
            id: string;
            name: string;
            imageUrl?: string;
            rating: number;
            totalRatings: number;
        };
        items: MenuItem[];
    }[]>;
    create(createMenuItemDto: CreateMenuItemDto, sellerId: string): Promise<MenuItem>;
    update(id: string, updateMenuItemDto: UpdateMenuItemDto, sellerId: string): Promise<MenuItem>;
    remove(id: string, sellerId: string): Promise<{
        success: boolean;
        removed: boolean;
    }>;
}
