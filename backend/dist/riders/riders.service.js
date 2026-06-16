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
exports.RidersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../entities/order.entity");
const notifications_service_1 = require("../notifications/notifications.service");
let RidersService = class RidersService {
    orderRepository;
    notificationsService;
    dataSource;
    constructor(orderRepository, notificationsService, dataSource) {
        this.orderRepository = orderRepository;
        this.notificationsService = notificationsService;
        this.dataSource = dataSource;
    }
    async getRiderStats(riderId) {
        const allDeliveries = await this.orderRepository.find({
            where: { riderId },
        });
        const completed = allDeliveries.filter((o) => o.status === 'delivered');
        const totalEarnings = completed.reduce((sum, o) => sum + Number(o.deliveryFee ?? 0), 0);
        return {
            totalDeliveries: allDeliveries.length,
            completedDeliveries: completed.length,
            totalEarnings,
        };
    }
    async findDeliveries(riderId, query) {
        const type = query.type ?? 'available';
        let orders = [];
        if (type === 'available') {
            orders = await this.orderRepository.find({
                where: {
                    status: 'accepted',
                    riderId: (0, typeorm_2.IsNull)(),
                },
                relations: {
                    vendor: true,
                    items: true,
                },
                order: { updatedAt: 'DESC' },
            });
        }
        else if (type === 'active') {
            orders = await this.orderRepository.find({
                where: [
                    { riderId, status: 'accepted' },
                    { riderId, status: 'preparing' },
                    { riderId, status: 'ready_for_pickup' },
                    { riderId, status: 'picked_up' },
                    { riderId, status: 'delivering' },
                ],
                relations: {
                    vendor: true,
                    items: true,
                },
                order: { updatedAt: 'DESC' },
            });
        }
        for (const order of orders) {
            await this.enrichOrderDetails(order);
        }
        return orders;
    }
    async acceptDelivery(orderId, riderId) {
        const result = await this.orderRepository.update({ id: orderId, status: 'accepted', riderId: (0, typeorm_2.IsNull)() }, { riderId });
        if (result.affected === 0) {
            throw new common_1.BadRequestException('This booking is no longer available or has already been claimed');
        }
        const updatedOrder = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: { vendor: true },
        });
        if (!updatedOrder) {
            throw new common_1.NotFoundException('Order not found');
        }
        await this.enrichOrderDetails(updatedOrder);
        await this.notifyDeliveryAccepted(updatedOrder);
        return updatedOrder;
    }
    async updateDeliveryStatus(orderId, riderId, updateStatusDto) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: {
                vendor: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.riderId !== riderId) {
            throw new common_1.ForbiddenException('Delivery is assigned to another rider');
        }
        const transitions = {
            accepted: ['ready_for_pickup'],
            preparing: ['ready_for_pickup'],
            ready_for_pickup: ['picked_up'],
            picked_up: ['delivering'],
            delivering: ['delivered'],
        };
        const allowed = transitions[order.status] ?? [];
        if (!allowed.includes(updateStatusDto.status)) {
            throw new common_1.BadRequestException('Invalid status transition');
        }
        order.status = updateStatusDto.status;
        const updatedOrder = await this.orderRepository.save(order);
        await this.enrichOrderDetails(updatedOrder);
        await this.notifyDeliveryStatusUpdate(order, updateStatusDto.status);
        return updatedOrder;
    }
    async notifyDeliveryAccepted(order) {
        await this.notificationsService.create({
            userId: order.customerId,
            title: 'Rider On The Way',
            message: 'A rider accepted your delivery and is heading to the shop',
            type: 'order_update',
            referenceId: order.id,
        });
        if (order.vendor?.userId) {
            await this.notificationsService.create({
                userId: order.vendor.userId,
                title: 'Rider Accepted',
                message: `A rider claimed the delivery for order #${order.id.slice(0, 8).toUpperCase()}`,
                type: 'delivery_request',
                referenceId: order.id,
            });
        }
    }
    async notifyDeliveryStatusUpdate(order, status) {
        if (status === 'ready_for_pickup') {
            await this.notificationsService.create({
                userId: order.customerId,
                title: 'Rider At The Shop',
                message: 'Your rider is at the shop waiting for your order',
                type: 'order_update',
                referenceId: order.id,
            });
            return;
        }
        if (status === 'picked_up') {
            await this.notificationsService.create({
                userId: order.customerId,
                title: 'Order Picked Up',
                message: 'Your order has been picked up and is moving to delivery',
                type: 'order_update',
                referenceId: order.id,
            });
            if (order.vendor?.userId) {
                await this.notificationsService.create({
                    userId: order.vendor.userId,
                    title: 'Order Picked Up',
                    message: 'The rider has picked up the order from your shop',
                    type: 'delivery_request',
                    referenceId: order.id,
                });
            }
            return;
        }
        if (status === 'delivering') {
            await this.notificationsService.create({
                userId: order.customerId,
                title: 'Order On The Way',
                message: 'Your rider is on the way to your delivery pin',
                type: 'order_update',
                referenceId: order.id,
            });
            return;
        }
        await this.notificationsService.create({
            userId: order.customerId,
            title: 'Order Delivered',
            message: 'Your rider marked the order as delivered. Enjoy!',
            type: 'order_update',
            referenceId: order.id,
        });
        if (order.vendor?.userId) {
            await this.notificationsService.create({
                userId: order.vendor.userId,
                title: 'Order Delivered',
                message: 'The rider completed the delivery for this order',
                type: 'delivery_request',
                referenceId: order.id,
            });
        }
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
exports.RidersService = RidersService;
exports.RidersService = RidersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        typeorm_2.DataSource])
], RidersService);
//# sourceMappingURL=riders.service.js.map