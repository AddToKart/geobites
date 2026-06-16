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
exports.MenuController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const session_guard_1 = require("../common/guards/session.guard");
const create_menu_item_dto_1 = require("./dto/create-menu-item.dto");
const update_menu_item_dto_1 = require("./dto/update-menu-item.dto");
const menu_service_1 = require("./menu.service");
let MenuController = class MenuController {
    constructor(menuService) {
        this.menuService = menuService;
    }
    findVendorMenu(vendorId) {
        return this.menuService.findVendorMenu(vendorId);
    }
    searchMenu(query, category, priceMin, priceMax) {
        if (!query || query.trim().length === 0) {
            return [];
        }
        return this.menuService.searchAcrossVendors(query.trim(), {
            category,
            priceMin: priceMin ? Number(priceMin) : undefined,
            priceMax: priceMax ? Number(priceMax) : undefined,
        });
    }
    create(createMenuItemDto, sellerId) {
        return this.menuService.create(createMenuItemDto, sellerId);
    }
    update(id, updateMenuItemDto, sellerId) {
        return this.menuService.update(id, updateMenuItemDto, sellerId);
    }
    remove(id, sellerId) {
        return this.menuService.remove(id, sellerId);
    }
};
exports.MenuController = MenuController;
__decorate([
    (0, common_1.Get)('vendors/:vendorId/menu'),
    __param(0, (0, common_1.Param)('vendorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "findVendorMenu", null);
__decorate([
    (0, common_1.Get)('menu/search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('priceMin')),
    __param(3, (0, common_1.Query)('priceMax')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "searchMenu", null);
__decorate([
    (0, common_1.Post)('menu'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_menu_item_dto_1.CreateMenuItemDto, String]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "create", null);
__decorate([
    (0, common_1.Put)('menu/:id'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_menu_item_dto_1.UpdateMenuItemDto, String]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('menu/:id'),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "remove", null);
exports.MenuController = MenuController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [menu_service_1.MenuService])
], MenuController);
//# sourceMappingURL=menu.controller.js.map