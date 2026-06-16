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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vendor = void 0;
const typeorm_1 = require("typeorm");
const decimal_number_transformer_1 = require("../database/decimal-number.transformer");
const menu_item_entity_1 = require("./menu-item.entity");
const order_entity_1 = require("./order.entity");
const promotion_entity_1 = require("./promotion.entity");
const rating_entity_1 = require("./rating.entity");
const favorite_entity_1 = require("./favorite.entity");
let Vendor = class Vendor {
    id;
    userId;
    name;
    description;
    address;
    latitude;
    longitude;
    rating;
    totalRatings;
    imageUrl;
    businessPermit;
    businessPermitExpiry;
    foodSafetyCert;
    foodSafetyCertExpiry;
    openTime;
    closeTime;
    operatingHours;
    commissionRate;
    isActive;
    isTemporarilyClosed;
    createdAt;
    updatedAt;
    menuItems;
    orders;
    ratings;
    promotions;
    favorites;
};
exports.Vendor = Vendor;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Vendor.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Vendor.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Vendor.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Vendor.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Vendor.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 10,
        scale: 8,
        transformer: decimal_number_transformer_1.decimalNumberTransformer,
    }),
    __metadata("design:type", Number)
], Vendor.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 11,
        scale: 8,
        transformer: decimal_number_transformer_1.decimalNumberTransformer,
    }),
    __metadata("design:type", Number)
], Vendor.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 3,
        scale: 2,
        default: 0,
        transformer: decimal_number_transformer_1.decimalNumberTransformer,
    }),
    __metadata("design:type", Number)
], Vendor.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Vendor.prototype, "totalRatings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Vendor.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Vendor.prototype, "businessPermit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Vendor.prototype, "businessPermitExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Vendor.prototype, "foodSafetyCert", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Vendor.prototype, "foodSafetyCertExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Vendor.prototype, "openTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Vendor.prototype, "closeTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Array)
], Vendor.prototype, "operatingHours", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 4,
        scale: 2,
        default: 0.25,
        transformer: decimal_number_transformer_1.decimalNumberTransformer,
    }),
    __metadata("design:type", Number)
], Vendor.prototype, "commissionRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Vendor.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Vendor.prototype, "isTemporarilyClosed", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Vendor.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Vendor.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => menu_item_entity_1.MenuItem, (menuItem) => menuItem.vendor),
    __metadata("design:type", Array)
], Vendor.prototype, "menuItems", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_entity_1.Order, (order) => order.vendor),
    __metadata("design:type", Array)
], Vendor.prototype, "orders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => rating_entity_1.Rating, (rating) => rating.vendor),
    __metadata("design:type", Array)
], Vendor.prototype, "ratings", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => promotion_entity_1.Promotion, (promotion) => promotion.vendor),
    __metadata("design:type", Array)
], Vendor.prototype, "promotions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => favorite_entity_1.Favorite, (favorite) => favorite.vendor),
    __metadata("design:type", Array)
], Vendor.prototype, "favorites", void 0);
exports.Vendor = Vendor = __decorate([
    (0, typeorm_1.Entity)('vendors'),
    (0, typeorm_1.Index)(['userId'], { unique: true }),
    (0, typeorm_1.Index)(['latitude', 'longitude']),
    (0, typeorm_1.Index)(['rating'])
], Vendor);
//# sourceMappingURL=vendor.entity.js.map