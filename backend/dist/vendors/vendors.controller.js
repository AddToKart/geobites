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
exports.VendorsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const session_guard_1 = require("../common/guards/session.guard");
const create_vendor_dto_1 = require("./dto/create-vendor.dto");
const query_vendors_dto_1 = require("./dto/query-vendors.dto");
const update_vendor_dto_1 = require("./dto/update-vendor.dto");
const vendors_service_1 = require("./vendors.service");
let VendorsController = class VendorsController {
    constructor(vendorsService) {
        this.vendorsService = vendorsService;
    }
    findAll(query) {
        return this.vendorsService.findAll(query);
    }
    findOne(id) {
        return this.vendorsService.findOne(id);
    }
    create(createVendorDto, userId) {
        return this.vendorsService.create(createVendorDto, userId);
    }
    update(id, updateVendorDto, userId) {
        return this.vendorsService.update(id, updateVendorDto, userId);
    }
    remove(id, userId) {
        return this.vendorsService.remove(id, userId);
    }
};
exports.VendorsController = VendorsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_vendors_dto_1.QueryVendorsDto]),
    __metadata("design:returntype", void 0)
], VendorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VendorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_vendor_dto_1.CreateVendorDto, String]),
    __metadata("design:returntype", void 0)
], VendorsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_vendor_dto_1.UpdateVendorDto, String]),
    __metadata("design:returntype", void 0)
], VendorsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], VendorsController.prototype, "remove", null);
exports.VendorsController = VendorsController = __decorate([
    (0, common_1.Controller)('vendors'),
    __metadata("design:paramtypes", [vendors_service_1.VendorsService])
], VendorsController);
//# sourceMappingURL=vendors.controller.js.map