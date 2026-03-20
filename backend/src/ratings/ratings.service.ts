import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { Rating } from '../entities/rating.entity';
import { Vendor } from '../entities/vendor.entity';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
  ) {}

  async create(
    createRatingDto: CreateRatingDto,
    customerId: string,
  ): Promise<Rating> {
    const order = await this.orderRepository.findOne({
      where: { id: createRatingDto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== customerId) {
      throw new ForbiddenException('You can only rate your own orders');
    }

    if (order.status !== 'delivered') {
      throw new BadRequestException('Only delivered orders can be rated');
    }

    const existingRating = await this.ratingRepository.findOne({
      where: { orderId: order.id },
    });

    if (existingRating) {
      throw new BadRequestException('Order already has a rating');
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

  async findByVendor(vendorId: string) {
    const ratings = await this.ratingRepository.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });

    const totalRatings = ratings.length;
    const averageScore =
      totalRatings === 0
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

  private async recomputeVendorRating(vendorId: string) {
    const ratings = await this.ratingRepository.find({
      where: { vendorId },
    });

    const totalRatings = ratings.length;
    const average =
      totalRatings === 0
        ? 0
        : ratings.reduce((sum, rating) => sum + rating.score, 0) / totalRatings;

    await this.vendorRepository.update(vendorId, {
      rating: Number(average.toFixed(2)),
      totalRatings,
    });
  }
}
