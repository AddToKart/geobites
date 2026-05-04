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
exports.Order = void 0;
const typeorm_1 = require("typeorm");
const decimal_number_transformer_1 = require("../database/decimal-number.transformer");
const order_item_entity_1 = require("./order-item.entity");
const rating_entity_1 = require("./rating.entity");
const vendor_entity_1 = require("./vendor.entity");
let Order = class Order {
    id;
    customerId;
    vendorId;
    riderId;
    status;
    totalAmount;
    street;
    barangay;
    landmark;
    floorOrGate;
    paymentMethod;
    paymentStatus;
    cancellationReason;
    disputeReason;
    disputeStatus;
    estimatedDeliveryTime;
    deliveryLat;
    deliveryLng;
    notes;
    createdAt;
    updatedAt;
    vendor;
    items;
    ratings;
};
exports.Order = Order;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Order.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Order.prototype, "vendorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "riderId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [
            'pending',
            'accepted',
            'preparing',
            'ready_for_pickup',
            'picked_up',
            'delivering',
            'delivered',
            'rejected',
            'cancelled',
        ],
        default: 'pending',
    }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 10,
        scale: 2,
        transformer: decimal_number_transformer_1.decimalNumberTransformer,
    }),
    __metadata("design:type", Number)
], Order.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "street", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "barangay", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "landmark", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "floorOrGate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['COD', 'GCASH', 'MAYA', 'QRPH'],
        default: 'COD',
    }),
    __metadata("design:type", String)
], Order.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
    }),
    __metadata("design:type", String)
], Order.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "cancellationReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "disputeReason", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['none', 'open', 'resolved_refunded', 'resolved_rejected'],
        default: 'none',
    }),
    __metadata("design:type", String)
], Order.prototype, "disputeStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "estimatedDeliveryTime", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 10,
        scale: 8,
        nullable: true,
        transformer: decimal_number_transformer_1.decimalNumberTransformer,
    }),
    __metadata("design:type", Number)
], Order.prototype, "deliveryLat", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 11,
        scale: 8,
        nullable: true,
        transformer: decimal_number_transformer_1.decimalNumberTransformer,
    }),
    __metadata("design:type", Number)
], Order.prototype, "deliveryLng", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Order.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Order.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vendor_entity_1.Vendor, (vendor) => vendor.orders, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'vendorId' }),
    __metadata("design:type", vendor_entity_1.Vendor)
], Order.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_item_entity_1.OrderItem, (orderItem) => orderItem.order, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => rating_entity_1.Rating, (rating) => rating.order),
    __metadata("design:type", Array)
], Order.prototype, "ratings", void 0);
exports.Order = Order = __decorate([
    (0, typeorm_1.Entity)('orders'),
    (0, typeorm_1.Index)(['customerId']),
    (0, typeorm_1.Index)(['vendorId']),
    (0, typeorm_1.Index)(['riderId']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['createdAt'])
], Order);
//# sourceMappingURL=order.entity.js.map