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
exports.VendorsService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const vendor_entity_1 = require("../entities/vendor.entity");
let VendorsService = class VendorsService {
    vendorRepository;
    constructor(vendorRepository) {
        this.vendorRepository = vendorRepository;
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const qb = this.vendorRepository.createQueryBuilder('vendor');
        qb.where("vendor.id NOT LIKE 'demo-%'");
        if (query.search) {
            qb.where('(LOWER(vendor.name) LIKE LOWER(:search) OR LOWER(vendor.description) LIKE LOWER(:search))', { search: `%${query.search}%` });
        }
        const sortBy = query.sortBy ?? 'rating';
        const hasCoordinates = query.lat !== undefined && query.lng !== undefined;
        if (sortBy === 'distance' && hasCoordinates) {
            qb.orderBy('((vendor.latitude - :lat) * (vendor.latitude - :lat) + (vendor.longitude - :lng) * (vendor.longitude - :lng))', 'ASC')
                .addOrderBy('vendor.rating', 'DESC')
                .addOrderBy('vendor.name', 'ASC')
                .setParameters({
                lat: query.lat,
                lng: query.lng,
            });
        }
        else if (sortBy === 'name') {
            qb.orderBy('vendor.name', 'ASC');
        }
        else {
            qb.orderBy('vendor.rating', 'DESC');
        }
        qb.skip(skip).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            total,
            page,
            limit,
        };
    }
    async findOne(id) {
        const vendor = await this.vendorRepository.findOne({
            where: { id },
            relations: {
                menuItems: true,
            },
        });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor not found');
        }
        return vendor;
    }
    async create(createVendorDto, ownerUserId) {
        const existingVendor = await this.vendorRepository.findOne({
            where: { userId: ownerUserId },
        });
        if (existingVendor) {
            throw new common_1.ForbiddenException('Seller already has a vendor profile');
        }
        const vendor = this.vendorRepository.create({
            id: (0, node_crypto_1.randomUUID)(),
            ...createVendorDto,
            userId: ownerUserId,
        });
        return this.vendorRepository.save(vendor);
    }
    async update(id, updateVendorDto, ownerUserId) {
        const vendor = await this.vendorRepository.findOne({
            where: { id },
        });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor not found');
        }
        if (vendor.userId !== ownerUserId) {
            throw new common_1.ForbiddenException('You can only update your own vendor');
        }
        Object.assign(vendor, updateVendorDto);
        return this.vendorRepository.save(vendor);
    }
    async remove(id, ownerUserId) {
        const vendor = await this.vendorRepository.findOne({
            where: { id },
        });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor not found');
        }
        if (vendor.userId !== ownerUserId) {
            throw new common_1.ForbiddenException('You can only delete your own vendor');
        }
        await this.vendorRepository.remove(vendor);
    }
};
exports.VendorsService = VendorsService;
exports.VendorsService = VendorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], VendorsService);
//# sourceMappingURL=vendors.service.js.map