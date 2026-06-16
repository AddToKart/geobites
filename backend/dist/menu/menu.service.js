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
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const menu_item_entity_1 = require("../entities/menu-item.entity");
const vendor_entity_1 = require("../entities/vendor.entity");
let MenuService = class MenuService {
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
    async searchAcrossVendors(query, filters) {
        const qb = this.menuRepository
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.vendor', 'vendor')
            .where('item.isAvailable = :available', { available: true })
            .andWhere('(LOWER(item.name) LIKE LOWER(:query) OR LOWER(item.description) LIKE LOWER(:query))', { query: `%${query}%` });
        if (filters?.category) {
            qb.andWhere('LOWER(item.category) = LOWER(:category)', {
                category: filters.category,
            });
        }
        if (filters?.priceMin !== undefined) {
            qb.andWhere('item.price >= :priceMin', { priceMin: filters.priceMin });
        }
        if (filters?.priceMax !== undefined) {
            qb.andWhere('item.price <= :priceMax', { priceMax: filters.priceMax });
        }
        qb.orderBy('item.name', 'ASC');
        const items = await qb.getMany();
        const grouped = {};
        for (const item of items) {
            if (!item.vendor)
                continue;
            const vid = item.vendor.id;
            if (!grouped[vid]) {
                grouped[vid] = {
                    vendor: {
                        id: item.vendor.id,
                        name: item.vendor.name,
                        imageUrl: item.vendor.imageUrl,
                        rating: item.vendor.rating,
                        totalRatings: item.vendor.totalRatings,
                    },
                    items: [],
                };
            }
            const { vendor, ...itemData } = item;
            void vendor;
            grouped[vid].items.push(itemData);
        }
        return Object.values(grouped);
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
            id: (0, node_crypto_1.randomUUID)(),
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
        let removed = true;
        try {
            await this.menuRepository.remove(menuItem);
        }
        catch {
            menuItem.isAvailable = false;
            await this.menuRepository.save(menuItem);
            removed = false;
        }
        return {
            success: true,
            removed,
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