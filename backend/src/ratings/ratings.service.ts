import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { Rating } from '../entities/rating.entity';
import { Vendor } from '../entities/vendor.entity';
import { NotificationsService } from '../notifications/notifications.service';
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
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createRatingDto: CreateRatingDto,
    customerId: string,
  ): Promise<Rating> {
    const { savedRating, vendorUserId, orderId } =
      await this.dataSource.transaction(async (manager) => {
        const orderRepository = manager.getRepository(Order);
        const ratingRepository = manager.getRepository(Rating);
        const vendorRepository = manager.getRepository(Vendor);

        const order = await orderRepository.findOne({
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

        const existingRating = await ratingRepository.findOne({
          where: { orderId: order.id },
        });

        if (existingRating) {
          throw new BadRequestException('Order already has a rating');
        }

        const rating = ratingRepository.create({
          orderId: order.id,
          customerId,
          vendorId: order.vendorId,
          score: createRatingDto.score,
          feedback: createRatingDto.feedback,
        });

        const savedRating = await ratingRepository.save(rating);
        await this.recomputeVendorRating(
          order.vendorId,
          ratingRepository,
          vendorRepository,
        );

        const vendor = await vendorRepository.findOne({
          where: { id: order.vendorId },
        });

        return {
          savedRating,
          vendorUserId: vendor?.userId ?? null,
          orderId: order.id,
        };
      });

    // Notify seller about the new rating
    if (vendorUserId) {
      await this.notificationsService.create({
        userId: vendorUserId,
        title: 'New Rating Received',
        message: `You received a ${createRatingDto.score}-star rating`,
        type: 'rating',
        referenceId: orderId,
      });
    }

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

  private async recomputeVendorRating(
    vendorId: string,
    ratingRepository: Repository<Rating>,
    vendorRepository: Repository<Vendor>,
  ) {
    const rawSummary = await ratingRepository
      .createQueryBuilder('rating')
      .select('COUNT(rating.id)', 'totalRatings')
      .addSelect('AVG(rating.score)', 'averageScore')
      .where('rating.vendorId = :vendorId', { vendorId })
      .getRawOne<{ totalRatings: string; averageScore: string | null }>();

    const totalRatings = Number(rawSummary?.totalRatings ?? 0);
    const average = Number(rawSummary?.averageScore ?? 0);

    await vendorRepository.update(vendorId, {
      rating: Number(average.toFixed(2)),
      totalRatings,
    });
  }
}
