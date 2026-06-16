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
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const menu_item_entity_1 = require("../entities/menu-item.entity");
const order_item_entity_1 = require("../entities/order-item.entity");
const order_entity_1 = require("../entities/order.entity");
const vendor_entity_1 = require("../entities/vendor.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const wallet_service_1 = require("../wallet/wallet.service");
const geopay_service_1 = require("../geopay/geopay.service");
const vouchers_service_1 = require("../vouchers/vouchers.service");
const distance_util_1 = require("../common/utils/distance.util");
const sellerTransitions = {
    pending: ['accepted', 'rejected'],
    accepted: ['preparing'],
    preparing: ['ready_for_pickup'],
};
const riderTransitions = {
    ready_for_pickup: ['ready_for_pickup', 'picked_up'],
    picked_up: ['delivering'],
    delivering: ['delivered'],
};
let OrdersService = OrdersService_1 = class OrdersService {
    orderRepository;
    orderItemRepository;
    menuItemRepository;
    vendorRepository;
    notificationsService;
    walletService;
    geopayService;
    vouchersService;
    dataSource;
    logger = new common_1.Logger(OrdersService_1.name);
    constructor(orderRepository, orderItemRepository, menuItemRepository, vendorRepository, notificationsService, walletService, geopayService, vouchersService, dataSource) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.menuItemRepository = menuItemRepository;
        this.vendorRepository = vendorRepository;
        this.notificationsService = notificationsService;
        this.walletService = walletService;
        this.geopayService = geopayService;
        this.vouchersService = vouchersService;
        this.dataSource = dataSource;
    }
    async create(createOrderDto, customerId) {
        const menuItemIds = createOrderDto.items.map((item) => item.menuItemId);
        if (new Set(menuItemIds).size !== menuItemIds.length) {
            throw new common_1.BadRequestException('Duplicate menu items are not allowed in a single order');
        }
        const { savedOrderId, sellerUserId } = await this.dataSource.transaction(async (manager) => {
            const vendorRepository = manager.getRepository(vendor_entity_1.Vendor);
            const menuItemRepository = manager.getRepository(menu_item_entity_1.MenuItem);
            const orderRepository = manager.getRepository(order_entity_1.Order);
            const orderItemRepository = manager.getRepository(order_item_entity_1.OrderItem);
            const vendor = await vendorRepository.findOne({
                where: { id: createOrderDto.vendorId },
            });
            if (!vendor) {
                throw new common_1.NotFoundException('Vendor not found');
            }
            if (!vendor.isActive) {
                throw new common_1.BadRequestException('Vendor is not accepting orders right now');
            }
            const menuItems = await menuItemRepository.find({
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
            const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            let deliveryFee = 0;
            if (createOrderDto.deliveryLat !== undefined &&
                createOrderDto.deliveryLng !== undefined) {
                const distanceKm = (0, distance_util_1.haversineKm)(vendor.latitude, vendor.longitude, createOrderDto.deliveryLat, createOrderDto.deliveryLng);
                deliveryFee = (0, distance_util_1.calculateDeliveryFee)(distanceKm);
            }
            let totalAmount = subtotal + deliveryFee;
            let discountAmount = 0;
            let discountLabel;
            if (createOrderDto.voucherCode) {
                const vd = await this.vouchersService.applyVoucher(createOrderDto.voucherCode, createOrderDto.vendorId, totalAmount);
                discountAmount += vd;
            }
            const pointsDiscount = createOrderDto.discountAmount ?? 0;
            if (pointsDiscount > 0) {
                const available = Math.min(pointsDiscount, totalAmount - discountAmount);
                if (available > 0) {
                    await this.geopayService.consumeDiscount(customerId, available);
                    discountAmount += available;
                }
            }
            if (discountAmount > 0) {
                totalAmount = Math.max(0, totalAmount - discountAmount);
                const parts = [];
                if (createOrderDto.voucherCode)
                    parts.push('Voucher');
                if (pointsDiscount > 0)
                    parts.push('Points');
                discountLabel = parts.join(' + ');
            }
            const order = orderRepository.create({
                customerId,
                vendorId: createOrderDto.vendorId,
                status: 'pending',
                totalAmount,
                deliveryFee,
                street: createOrderDto.street || createOrderDto.deliveryAddress,
                barangay: createOrderDto.barangay,
                landmark: createOrderDto.landmark,
                floorOrGate: createOrderDto.floorOrGate,
                paymentMethod: createOrderDto.paymentMethod || 'COD',
                paymentStatus: 'pending',
                paymentSessionId: createOrderDto.paymentReference || undefined,
                deliveryLat: createOrderDto.deliveryLat,
                deliveryLng: createOrderDto.deliveryLng,
                notes: createOrderDto.notes,
                discountAmount,
                discountLabel,
            });
            const savedOrder = await orderRepository.save(order);
            const snapshots = orderItems.map((item) => orderItemRepository.create({
                orderId: savedOrder.id,
                menuItemId: item.menuItem.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
            }));
            await orderItemRepository.save(snapshots);
            return {
                savedOrderId: savedOrder.id,
                sellerUserId: vendor.userId,
            };
        });
        await this.notificationsService.create({
            userId: sellerUserId,
            title: 'New Order',
            message: 'You have received a new order',
            type: 'order_update',
            referenceId: savedOrderId,
        });
        return this.findOneForUser(savedOrderId, customerId, 'customer');
    }
    async findAllForUser(userId, role, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        try {
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
            else if (role === 'seller') {
                const sellerVendor = await this.vendorRepository.findOne({
                    where: { userId },
                });
                if (!sellerVendor) {
                    return { data: [], total: 0, page, limit };
                }
                qb.where('order.vendorId = :vendorId', { vendorId: sellerVendor.id });
            }
            else if (role === 'rider') {
                qb.where('order.riderId = :userId', { userId });
            }
            else {
                throw new common_1.BadRequestException(`Invalid role: ${role}`);
            }
            if (query.status) {
                qb.andWhere('order.status = :status', { status: query.status });
            }
            const [data, total] = await qb.getManyAndCount();
            for (const order of data) {
                await this.enrichOrderDetails(order);
            }
            return {
                data,
                total,
                page,
                limit,
            };
        }
        catch (error) {
            console.error('findAllForUser error:', {
                userId,
                role,
                query,
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
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
        await this.enrichOrderDetails(order);
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
            const cancellableStatuses = ['pending', 'accepted', 'preparing'];
            if (!(cancellableStatuses.includes(currentStatus) &&
                nextStatus === 'cancelled')) {
                throw new common_1.BadRequestException('Invalid customer status transition');
            }
            order.cancellationReason =
                updateStatusDto.cancellationReason || 'Cancelled by customer';
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
            if (nextStatus === 'preparing') {
                const eta = new Date();
                eta.setMinutes(eta.getMinutes() + 45);
                order.estimatedDeliveryTime = eta;
            }
        }
        if (role === 'rider') {
            const allowed = riderTransitions[currentStatus] ?? [];
            if (!allowed.includes(nextStatus)) {
                throw new common_1.BadRequestException('Invalid rider status transition');
            }
            if (order.riderId && order.riderId !== userId) {
                throw new common_1.ForbiddenException('Order is already assigned to another rider');
            }
            if (!order.riderId && nextStatus !== 'ready_for_pickup') {
                throw new common_1.ForbiddenException('Order must be accepted before updating status');
            }
            if (nextStatus === 'ready_for_pickup' && !order.riderId) {
                order.riderId = userId;
            }
        }
        order.status = nextStatus;
        const updatedOrder = await this.orderRepository.save(order);
        if (nextStatus === 'cancelled' &&
            role === 'customer' &&
            order.paymentMethod === 'GEOPAY' &&
            order.paymentStatus === 'paid') {
            try {
                await this.walletService.refundGeoPayOrder(order.vendorId, order.customerId, order.id, Number(order.totalAmount));
                this.logger.log(`GeoPay refund processed for cancelled order ${order.id}`);
            }
            catch (refundError) {
                this.logger.error(`Failed to process GeoPay refund for order ${order.id}:`, refundError);
            }
        }
        if (nextStatus === 'cancelled' &&
            role === 'customer' &&
            order.vendor?.userId) {
            await this.notificationsService.create({
                userId: order.vendor.userId,
                title: 'Order Cancelled',
                message: `Order #${order.id.slice(0, 8)} was cancelled by the customer`,
                type: 'order_update',
                referenceId: order.id,
            });
        }
        if (nextStatus === 'accepted') {
            await this.notificationsService.create({
                userId: order.customerId,
                title: 'Order Accepted',
                message: 'Your order has been accepted by the vendor',
                type: 'order_update',
                referenceId: order.id,
            });
        }
        else if (nextStatus === 'rejected') {
            await this.notificationsService.create({
                userId: order.customerId,
                title: 'Order Rejected',
                message: 'Your order was rejected by the vendor',
                type: 'order_update',
                referenceId: order.id,
            });
        }
        else if (nextStatus === 'ready_for_pickup') {
            await this.notificationsService.create({
                userId: order.customerId,
                title: 'Order Ready',
                message: 'Your order is ready for pickup',
                type: 'order_update',
                referenceId: order.id,
            });
        }
        else if (nextStatus === 'picked_up') {
            await this.notificationsService.create({
                userId: order.customerId,
                title: 'Order Picked Up',
                message: 'Your order has been picked up for delivery',
                type: 'order_update',
                referenceId: order.id,
            });
        }
        else if (nextStatus === 'delivered') {
            await this.notificationsService.create({
                userId: order.customerId,
                title: 'Order Delivered',
                message: 'Your order has been delivered',
                type: 'order_update',
                referenceId: order.id,
            });
            try {
                await this.geopayService.awardPoints(order.customerId, Number(order.totalAmount), order.id);
                this.logger.log(`Reward points awarded for delivered order ${order.id}`);
            }
            catch (pointsError) {
                this.logger.error(`Failed to award points for order ${order.id}:`, pointsError);
            }
            try {
                await this.geopayService.rewardReferralOnFirstOrder(order.customerId);
            }
            catch (refError) {
                this.logger.error(`Failed to reward referral for user ${order.customerId}:`, refError);
            }
        }
        return updatedOrder;
    }
    async getAvailableRiders() {
        const isSqlite = this.dataSource.options.type === 'better-sqlite3' ||
            this.dataSource.options.type === 'sqljs';
        const query = isSqlite
            ? `
        SELECT 
          u.id, 
          u.name, 
          u.phone,
          rl.lat, 
          rl.lng, 
          rl.updatedAt as lastActive,
          CASE WHEN rl.orderId IS NULL THEN 'available' ELSE 'busy' END as status
        FROM user u
        LEFT JOIN rider_locations rl ON rl.riderId = u.id
        WHERE u.role = 'rider'
      `
            : `
        SELECT 
          u.id, 
          u.name, 
          u.phone,
          rl.lat, 
          rl.lng, 
          rl."updatedAt" as "lastActive",
          CASE WHEN rl."orderId" IS NULL THEN 'available' ELSE 'busy' END as status
        FROM "user" u
        LEFT JOIN "rider_locations" rl ON rl."riderId" = u.id
        WHERE u.role = 'rider'
      `;
        return this.dataSource.query(query);
    }
    async assignRider(id, riderId, sellerId) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: { vendor: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        const sellerVendor = await this.vendorRepository.findOne({
            where: { userId: sellerId },
        });
        if (!sellerVendor || sellerVendor.id !== order.vendorId) {
            throw new common_1.ForbiddenException('You can only assign riders to your own orders');
        }
        if (order.status === 'pending' ||
            order.status === 'rejected' ||
            order.status === 'cancelled' ||
            order.status === 'delivered') {
            throw new common_1.BadRequestException('Cannot assign a rider to this order in its current status');
        }
        const isSqlite = this.dataSource.options.type === 'better-sqlite3' ||
            this.dataSource.options.type === 'sqljs';
        const query = isSqlite
            ? `SELECT id FROM user WHERE id = ? AND role = 'rider'`
            : `SELECT id FROM "user" WHERE id = $1 AND role = 'rider'`;
        const params = [riderId];
        const riderExists = await this.dataSource.query(query, params);
        if (!riderExists || riderExists.length === 0) {
            throw new common_1.BadRequestException('Invalid rider');
        }
        order.riderId = riderId;
        const updated = await this.orderRepository.save(order);
        await this.notificationsService.create({
            userId: riderId,
            title: 'New Delivery Assigned',
            message: `You have been assigned to deliver order #${order.id.slice(0, 8)}`,
            type: 'delivery_request',
            referenceId: order.id,
        });
        await this.notificationsService.create({
            userId: order.customerId,
            title: 'Rider Assigned',
            message: 'A rider has been assigned to deliver your order',
            type: 'order_update',
            referenceId: order.id,
        });
        return updated;
    }
    async enrichOrderDetails(order) {
        if (order.riderId) {
            const isSqlite = this.dataSource.options.type === 'better-sqlite3' ||
                this.dataSource.options.type === 'sqljs';
            const query = isSqlite
                ? 'SELECT name, phone FROM user WHERE id = ?'
                : 'SELECT name, phone FROM "user" WHERE id = $1';
            const riders = await this.dataSource.query(query, [order.riderId]);
            if (riders && riders[0]) {
                order.riderName = riders[0].name;
                order.riderPhone = riders[0].phone || 'N/A';
            }
        }
        if (order.customerId) {
            const isSqlite = this.dataSource.options.type === 'better-sqlite3' ||
                this.dataSource.options.type === 'sqljs';
            const query = isSqlite
                ? 'SELECT name, phone FROM user WHERE id = ?'
                : 'SELECT name, phone FROM "user" WHERE id = $1';
            const customers = await this.dataSource.query(query, [order.customerId]);
            if (customers && customers[0]) {
                order.customerName = customers[0].name;
                order.customerPhone = customers[0].phone || 'N/A';
            }
        }
        if (order.vendor && order.vendor.userId) {
            const isSqlite = this.dataSource.options.type === 'better-sqlite3' ||
                this.dataSource.options.type === 'sqljs';
            const query = isSqlite
                ? 'SELECT phone FROM user WHERE id = ?'
                : 'SELECT phone FROM "user" WHERE id = $1';
            const sellers = await this.dataSource.query(query, [order.vendor.userId]);
            if (sellers && sellers[0]) {
                order.vendorPhone = sellers[0].phone || 'N/A';
            }
        }
        return order;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(menu_item_entity_1.MenuItem)),
    __param(3, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        wallet_service_1.WalletService,
        geopay_service_1.GeopayService,
        vouchers_service_1.VouchersService,
        typeorm_2.DataSource])
], OrdersService);
//# sourceMappingURL=orders.service.js.map