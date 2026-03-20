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
exports.RatingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../entities/order.entity");
const rating_entity_1 = require("../entities/rating.entity");
const vendor_entity_1 = require("../entities/vendor.entity");
let RatingsService = class RatingsService {
    ratingRepository;
    orderRepository;
    vendorRepository;
    constructor(ratingRepository, orderRepository, vendorRepository) {
        this.ratingRepository = ratingRepository;
        this.orderRepository = orderRepository;
        this.vendorRepository = vendorRepository;
    }
    async create(createRatingDto, customerId) {
        const order = await this.orderRepository.findOne({
            where: { id: createRatingDto.orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.customerId !== customerId) {
            throw new common_1.ForbiddenException('You can only rate your own orders');
        }
        if (order.status !== 'delivered') {
            throw new common_1.BadRequestException('Only delivered orders can be rated');
        }
        const existingRating = await this.ratingRepository.findOne({
            where: { orderId: order.id },
        });
        if (existingRating) {
            throw new common_1.BadRequestException('Order already has a rating');
        }
        const rating = this.ratingRepository.create({
            orderId: order.id,
            customerId,
            vendorId: order.vendorId,
            score: createRatingDto.score,
            feedback: createRatingDto.feedback,
        });
        const savedRating = await this.ratingRepository.save(rating);
        await this.recomputeVendorRating(order.vendorId);
        return savedRating;
    }
    async findByVendor(vendorId) {
        const ratings = await this.ratingRepository.find({
            where: { vendorId },
            order: { createdAt: 'DESC' },
        });
        const totalRatings = ratings.length;
        const averageScore = totalRatings === 0
            ? 0
            : ratings.reduce((sum, rating) => sum + rating.score, 0) / totalRatings;
        return {
            averageScore,
            totalRatings,
            ratings: ratings.map((rating) => ({
                id: rating.id,
                score: rating.score,
                feedback: rating.feedback,
                customerName: 'Customer',
                createdAt: rating.createdAt,
            })),
        };
    }
    async recomputeVendorRating(vendorId) {
        const ratings = await this.ratingRepository.find({
            where: { vendorId },
        });
        const totalRatings = ratings.length;
        const average = totalRatings === 0
            ? 0
            : ratings.reduce((sum, rating) => sum + rating.score, 0) / totalRatings;
        await this.vendorRepository.update(vendorId, {
            rating: Number(average.toFixed(2)),
            totalRatings,
        });
    }
};
exports.RatingsService = RatingsService;
exports.RatingsService = RatingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rating_entity_1.Rating)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(2, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RatingsService);
//# sourceMappingURL=ratings.service.js.map