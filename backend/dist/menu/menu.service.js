"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const menu_item_entity_1 = require("../entities/menu-item.entity");
const vendor_entity_1 = require("../entities/vendor.entity");
let MenuService = class MenuService {
    menuRepository;
    vendorRepository;
    constructor(menuRepository, vendorRepository) {
        this.menuRepository = menuRepository;
        this.vendorRepository = vendorRepository;
    }
    async findVendorMenu(vendorId) {
        return this.menuRepository.find({
            where: { vendorId },
            order: { name: 'ASC' },
        });
    }
    async create(createMenuItemDto, sellerId) {
        const vendor = await this.vendorRepository.findOne({
            where: {
                id: createMenuItemDto.vendorId,
            },
        });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor not found');
        }
        if (vendor.userId !== sellerId) {
            throw new common_1.ForbiddenException('You can only manage your own menu');
        }
        const menuItem = this.menuRepository.create({
            ...createMenuItemDto,
            isAvailable: createMenuItemDto.isAvailable ?? true,
        });
        return this.menuRepository.save(menuItem);
    }
    async update(id, updateMenuItemDto, sellerId) {
        const menuItem = await this.menuRepository.findOne({
            where: { id },
            relations: {
                vendor: true,
            },
        });
        if (!menuItem) {
            throw new common_1.NotFoundException('Menu item not found');
        }
        if (menuItem.vendor.userId !== sellerId) {
            throw new common_1.ForbiddenException('You can only manage your own menu');
        }
        Object.assign(menuItem, updateMenuItemDto);
        return this.menuRepository.save(menuItem);
    }
    async remove(id, sellerId) {
        const menuItem = await this.menuRepository.findOne({
            where: { id },
            relations: {
                vendor: true,
            },
        });
        if (!menuItem) {
            throw new common_1.NotFoundException('Menu item not found');
        }
        if (menuItem.vendor.userId !== sellerId) {
            throw new common_1.ForbiddenException('You can only manage your own menu');
        }
        await this.menuRepository.remove(menuItem);
        return {
            success: true,
        };
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(menu_item_entity_1.MenuItem)),
    __param(1, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], MenuService);
//# sourceMappingURL=menu.service.js.map