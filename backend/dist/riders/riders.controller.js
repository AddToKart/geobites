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
exports.RidersController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const session_guard_1 = require("../common/guards/session.guard");
const query_rider_deliveries_dto_1 = require("./dto/query-rider-deliveries.dto");
const update_delivery_status_dto_1 = require("./dto/update-delivery-status.dto");
const riders_service_1 = require("./riders.service");
let RidersController = class RidersController {
    ridersService;
    constructor(ridersService) {
        this.ridersService = ridersService;
    }
    findDeliveries(riderId, query) {
        return this.ridersService.findDeliveries(riderId, query);
    }
    acceptDelivery(orderId, riderId) {
        return this.ridersService.acceptDelivery(orderId, riderId);
    }
    updateStatus(orderId, riderId, updateStatusDto) {
        return this.ridersService.updateDeliveryStatus(orderId, riderId, updateStatusDto);
    }
};
exports.RidersController = RidersController;
__decorate([
    (0, common_1.Get)('deliveries'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_rider_deliveries_dto_1.QueryRiderDeliveriesDto]),
    __metadata("design:returntype", void 0)
], RidersController.prototype, "findDeliveries", null);
__decorate([
    (0, common_1.Patch)('deliveries/:orderId/accept'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RidersController.prototype, "acceptDelivery", null);
__decorate([
    (0, common_1.Patch)('deliveries/:orderId/status'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_delivery_status_dto_1.UpdateDeliveryStatusDto]),
    __metadata("design:returntype", void 0)
], RidersController.prototype, "updateStatus", null);
exports.RidersController = RidersController = __decorate([
    (0, common_1.Controller)('riders'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('rider'),
    __metadata("design:paramtypes", [riders_service_1.RidersService])
], RidersController);
//# sourceMappingURL=riders.controller.js.map