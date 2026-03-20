import { Repository } from 'typeorm';
import { MenuItem } from '../entities/menu-item.entity';
import { Vendor } from '../entities/vendor.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
export declare class MenuService {
    private readonly menuRepository;
    private readonly vendorRepository;
    constructor(menuRepository: Repository<MenuItem>, vendorRepository: Repository<Vendor>);
    findVendorMenu(vendorId: string): Promise<MenuItem[]>;
    create(createMenuItemDto: CreateMenuItemDto, sellerId: string): Promise<MenuItem>;
    update(id: string, updateMenuItemDto: UpdateMenuItemDto, sellerId: string): Promise<MenuItem>;
    remove(id: string, sellerId: string): Promise<{
        success: boolean;
    }>;
}
