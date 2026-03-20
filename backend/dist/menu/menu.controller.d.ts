import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuService } from './menu.service';
export declare class MenuController {
    private readonly menuService;
    constructor(menuService: MenuService);
    findVendorMenu(vendorId: string): Promise<import("../entities/menu-item.entity").MenuItem[]>;
    create(createMenuItemDto: CreateMenuItemDto, sellerId: string): Promise<import("../entities/menu-item.entity").MenuItem>;
    update(id: string, updateMenuItemDto: UpdateMenuItemDto, sellerId: string): Promise<import("../entities/menu-item.entity").MenuItem>;
    remove(id: string, sellerId: string): Promise<{
        success: boolean;
    }>;
}
