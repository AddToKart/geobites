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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const menu_item_entity_1 = require("../entities/menu-item.entity");
const order_item_entity_1 = require("../entities/order-item.entity");
const order_entity_1 = require("../entities/order.entity");
const vendor_entity_1 = require("../entities/vendor.entity");
const sellerTransitions = {
    pending: ['accepted', 'rejected'],
    accepted: ['preparing'],
    preparing: ['ready_for_pickup'],
};
const riderTransitions = {
    ready_for_pickup: ['picked_up'],
    picked_up: ['delivering'],
    delivering: ['delivered'],
};
let OrdersService = class OrdersService {
    orderRepository;
    orderItemRepository;
    menuItemRepository;
    vendorRepository;
    constructor(orderRepository, orderItemRepository, menuItemRepository, vendorRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.menuItemRepository = menuItemRepository;
        this.vendorRepository = vendorRepository;
    }
    async create(createOrderDto, customerId) {
        const vendor = await this.vendorRepository.findOne({
            where: { id: createOrderDto.vendorId },
        });
        if (!vendor) {
            throw new common_1.NotFoundException('Vendor not found');
        }
        const menuItemIds = createOrderDto.items.map((item) => item.menuItemId);
        const menuItems = await this.menuItemRepository.find({
            where: {
                id: (0, typeorm_2.In)(menuItemIds),
                vendorId: createOrderDto.vendorId,
            },
        });
        if (menuItems.length !== menuItemIds.length) {
            throw new common_1.BadRequestException('One or more menu items are invalid');
        }
        const orderItems = createOrderDto.items.map((item) => {
            const menuItem = menuItems.find((candidate) => candidate.id === item.menuItemId);
            if (!menuItem) {
                throw new common_1.BadRequestException('Menu item not found in vendor menu');
            }
            if (!menuItem.isAvailable) {
                throw new common_1.BadRequestException(`Menu item ${menuItem.name} is not available`);
            }
            return {
                menuItem,
                quantity: item.quantity,
                price: Number(menuItem.price),
                name: menuItem.name,
            };
        });
        const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const order = this.orderRepository.create({
            customerId,
            vendorId: createOrderDto.vendorId,
            status: 'pending',
            totalAmount,
            deliveryAddress: createOrderDto.deliveryAddress,
            deliveryLat: createOrderDto.deliveryLat,
            deliveryLng: createOrderDto.deliveryLng,
            notes: createOrderDto.notes,
        });
        const savedOrder = await this.orderRepository.save(order);
        const snapshots = orderItems.map((item) => this.orderItemRepository.create({
            orderId: savedOrder.id,
            menuItemId: item.menuItem.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
        }));
        await this.orderItemRepository.save(snapshots);
        return this.findOneForUser(savedOrder.id, customerId, 'customer');
    }
    async findAllForUser(userId, role, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const qb = this.orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.vendor', 'vendor')
            .leftJoinAndSelect('order.items', 'items')
            .orderBy('order.createdAt', 'DESC')
            .skip(skip)
            .take(limit);
        if (role === 'customer') {
            qb.where('order.customerId = :userId', { userId });
        }
        if (role === 'seller') {
            const sellerVendor = await this.vendorRepository.findOne({
                where: { userId },
            });
            if (!sellerVendor) {
                return { data: [], total: 0, page, limit };
            }
            qb.where('order.vendorId = :vendorId', { vendorId: sellerVendor.id });
        }
        if (role === 'rider') {
            qb.where('order.riderId = :userId', { userId });
        }
        if (query.status) {
            qb.andWhere('order.status = :status', { status: query.status });
        }
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            total,
            page,
            limit,
        };
    }
    async findOneForUser(id, userId, role) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: {
                items: true,
                vendor: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (role === 'customer' && order.customerId !== userId) {
            throw new common_1.ForbiddenException('You are not allowed to access this order');
        }
        if (role === 'rider' && order.riderId !== userId) {
            throw new common_1.ForbiddenException('You are not allowed to access this order');
        }
        if (role === 'seller') {
            const sellerVendor = await this.vendorRepository.findOne({
                where: { userId },
            });
            if (!sellerVendor || sellerVendor.id !== order.vendorId) {
                throw new common_1.ForbiddenException('You are not allowed to access this order');
            }
        }
        return order;
    }
    async updateStatus(id, updateStatusDto, userId, role) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: {
                vendor: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const nextStatus = updateStatusDto.status;
        const currentStatus = order.status;
        if (role === 'customer') {
            if (order.customerId !== userId) {
                throw new common_1.ForbiddenException('You can only update your own orders');
            }
            if (!(currentStatus === 'pending' && nextStatus === 'cancelled')) {
                throw new common_1.BadRequestException('Invalid customer status transition');
            }
        }
        if (role === 'seller') {
            const sellerVendor = await this.vendorRepository.findOne({
                where: { userId },
            });
            if (!sellerVendor || sellerVendor.id !== order.vendorId) {
                throw new common_1.ForbiddenException('You can only update your own vendor orders');
            }
            const allowed = sellerTransitions[currentStatus] ?? [];
            if (!allowed.includes(nextStatus)) {
                throw new common_1.BadRequestException('Invalid seller status transition');
            }
        }
        if (role === 'rider') {
            const allowed = riderTransitions[currentStatus] ?? [];
            if (!allowed.includes(nextStatus)) {
                throw new common_1.BadRequestException('Invalid rider status transition');
            }
            if (order.riderId && order.riderId !== userId) {
                throw new common_1.ForbiddenException('Order is assigned to another rider');
            }
            if (!order.riderId) {
                order.riderId = userId;
            }
        }
        order.status = nextStatus;
        return this.orderRepository.save(order);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(menu_item_entity_1.MenuItem)),
    __param(3, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], OrdersService);
//# sourceMappingURL=orders.service.js.map