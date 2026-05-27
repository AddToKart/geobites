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
    constructor(orderRepository, notificationsService) {
        this.orderRepository = orderRepository;
        this.notificationsService = notificationsService;
    }
    async findDeliveries(riderId, query) {
        const type = query.type ?? 'available';
        if (type === 'active') {
            return this.orderRepository.find({
                where: [
                    { riderId, status: 'ready_for_pickup' },
                    { riderId, status: 'picked_up' },
                    { riderId, status: 'delivering' },
                ],
                relations: {
                    vendor: true,
                },
                order: { updatedAt: 'DESC' },
            });
        }
        return this.orderRepository.find({
            where: {
                status: 'ready_for_pickup',
                riderId: (0, typeorm_2.IsNull)(),
            },
            relations: {
                vendor: true,
            },
            order: {
                createdAt: 'ASC',
            },
        });
    }
    async acceptDelivery(orderId, riderId) {
        const result = await this.orderRepository.update({ id: orderId, status: 'ready_for_pickup', riderId: (0, typeorm_2.IsNull)() }, { riderId });
        if (result.affected === 0) {
            throw new common_1.BadRequestException('Order is no longer available or already accepted');
        }
        const updatedOrder = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: { vendor: true },
        });
        if (!updatedOrder) {
            throw new common_1.NotFoundException('Order not found');
        }
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
        await this.notifyDeliveryStatusUpdate(order, updateStatusDto.status);
        return updatedOrder;
    }
    async notifyDeliveryAccepted(order) {
        await this.notificationsService.create({
            userId: order.customerId,
            title: 'Rider Assigned',
            message: 'A rider has accepted your delivery request',
            type: 'order_update',
            referenceId: order.id,
        });
        if (order.vendor?.userId) {
            await this.notificationsService.create({
                userId: order.vendor.userId,
                title: 'Rider Assigned',
                message: 'A rider is heading to pick up this order',
                type: 'delivery_request',
                referenceId: order.id,
            });
        }
    }
    async notifyDeliveryStatusUpdate(order, status) {
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
                message: 'Your rider is on the way to the delivery pin',
                type: 'order_update',
                referenceId: order.id,
            });
            return;
        }
        await this.notificationsService.create({
            userId: order.customerId,
            title: 'Order Delivered',
            message: 'Your rider marked the order as delivered',
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
};
exports.RidersService = RidersService;
exports.RidersService = RidersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], RidersService);
//# sourceMappingURL=riders.service.js.map