import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { RiderRating } from '../entities/rider-rating.entity';
import { Vendor } from '../entities/vendor.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRiderRatingDto } from './dto/create-rider-rating.dto';

@Injectable()
export class RiderRatingsService {
  constructor(
    @InjectRepository(RiderRating)
    private readonly riderRatingRepository: Repository<RiderRating>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateRiderRatingDto,
    userId: string,
    role: 'customer' | 'seller',
  ): Promise<RiderRating> {
    const { savedRating, riderId, orderId } = await this.dataSource.transaction(
      async (manager) => {
        const orderRepository = manager.getRepository(Order);
        const riderRatingRepository = manager.getRepository(RiderRating);
        const vendorRepository = manager.getRepository(Vendor);

        const order = await orderRepository.findOne({
          where: { id: dto.orderId },
        });

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        if (order.status !== 'delivered') {
          throw new BadRequestException('Only delivered orders can be rated');
        }

        if (!order.riderId) {
          throw new BadRequestException('No rider was assigned to this order');
        }

        // Validate permissions
        if (role === 'customer') {
          if (order.customerId !== userId) {
            throw new ForbiddenException(
              'You can only rate the rider for your own orders',
            );
          }
        } else if (role === 'seller') {
          const sellerVendor = await vendorRepository.findOne({
            where: { userId },
          });
          if (!sellerVendor || sellerVendor.id !== order.vendorId) {
            throw new ForbiddenException(
              'You can only rate the rider for orders placed at your shop',
            );
          }
        }

        // Check for duplicate review
        const existingRating = await riderRatingRepository.findOne({
          where: { orderId: order.id, raterRole: role },
        });

        if (existingRating) {
          throw new BadRequestException(
            'You have already rated the rider for this order',
          );
        }

        const rating = riderRatingRepository.create({
          orderId: order.id,
          riderId: order.riderId,
          raterId: userId,
          raterRole: role,
          score: dto.score,
          feedback: dto.feedback,
        });

        const savedRating = await riderRatingRepository.save(rating);

        return {
          savedRating,
          riderId: order.riderId,
          orderId: order.id,
        };
      },
    );

    try {
      // Notify rider about the new rating
      await this.notificationsService.create({
        userId: riderId,
        title: 'New Rating Received',
        message: `You received a ${dto.score}-star rating from a ${role}`,
        type: 'rating',
        referenceId: orderId,
      });
    } catch (e) {
      // Don't fail the rating request if notification delivery encounters an issue
      console.error('Failed to send rider rating notification:', e);
    }

    return savedRating;
  }
}
