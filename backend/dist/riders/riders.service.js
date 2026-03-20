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
let RidersService = class RidersService {
    orderRepository;
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
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
                order: { updatedAt: 'DESC' },
            });
        }
        return this.orderRepository.find({
            where: {
                status: 'ready_for_pickup',
                riderId: (0, typeorm_2.IsNull)(),
            },
            order: {
                createdAt: 'ASC',
            },
        });
    }
    async acceptDelivery(orderId, riderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.status !== 'ready_for_pickup') {
            throw new common_1.BadRequestException('Order is not ready for pickup');
        }
        if (order.riderId) {
            throw new common_1.BadRequestException('Order has already been assigned to a rider');
        }
        order.riderId = riderId;
        return this.orderRepository.save(order);
    }
    async updateDeliveryStatus(orderId, riderId, updateStatusDto) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
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
        return this.orderRepository.save(order);
    }
};
exports.RidersService = RidersService;
exports.RidersService = RidersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], RidersService);
//# sourceMappingURL=riders.service.js.map