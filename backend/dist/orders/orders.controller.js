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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const session_guard_1 = require("../common/guards/session.guard");
const create_order_dto_1 = require("./dto/create-order.dto");
const query_orders_dto_1 = require("./dto/query-orders.dto");
const update_order_status_dto_1 = require("./dto/update-order-status.dto");
const orders_service_1 = require("./orders.service");
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    create(createOrderDto, userId) {
        return this.ordersService.create(createOrderDto, userId);
    }
    async findAll(userId, role, query) {
        try {
            return await this.ordersService.findAllForUser(userId, role, query);
        }
        catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    }
    findOne(id, userId, role) {
        return this.ordersService.findOneForUser(id, userId, role);
    }
    updateStatus(id, updateStatusDto, userId, role) {
        return this.ordersService.updateStatus(id, updateStatusDto, userId, role);
    }
    getAvailableRiders() {
        return this.ordersService.getAvailableRiders();
    }
    assignRider(id, riderId, sellerId) {
        return this.ordersService.assignRider(id, riderId, sellerId);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('customer', 'seller'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('customer', 'seller', 'rider'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, query_orders_dto_1.QueryOrdersDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)('customer', 'seller', 'rider'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_order_status_dto_1.UpdateOrderStatusDto, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)('riders/available'),
    (0, roles_decorator_1.Roles)('seller'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getAvailableRiders", null);
__decorate([
    (0, common_1.Post)(':id/assign-rider'),
    (0, roles_decorator_1.Roles)('seller'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('riderId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "assignRider", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('orders'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map