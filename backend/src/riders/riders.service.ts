import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { RiderRating } from '../entities/rider-rating.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { QueryRiderDeliveriesDto } from './dto/query-rider-deliveries.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

@Injectable()
export class RidersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(RiderRating)
    private readonly riderRatingRepository: Repository<RiderRating>,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async getRiderStats(riderId: string) {
    const rawSummary = await this.riderRatingRepository
      .createQueryBuilder('riderRating')
      .select('COUNT(riderRating.id)', 'totalRatings')
      .addSelect('AVG(riderRating.score)', 'averageScore')
      .where('riderRating.riderId = :riderId', { riderId })
      .getRawOne<{ totalRatings: string; averageScore: string | null }>();

    const totalRatings = Number(rawSummary?.totalRatings ?? 0);
    const average = Number(rawSummary?.averageScore ?? 0);

    const totalDeliveries = await this.orderRepository.count({
      where: {
        riderId,
        status: 'delivered',
      },
    });

    return {
      averageRating: totalRatings === 0 ? 0.0 : Number(average.toFixed(2)),
      totalRatings,
      totalDeliveries,
    };
  }

  async findDeliveries(riderId: string, query: QueryRiderDeliveriesDto) {
    const type = query.type ?? 'available';
    let orders: Order[] = [];

    if (type === 'available') {
      // Global booking pool: orders accepted by seller, not yet claimed by a rider
      orders = await this.orderRepository.find({
        where: {
          status: 'accepted',
          riderId: IsNull(),
          orderType: 'DELIVERY',
        },
        relations: {
          vendor: true,
          items: true,
        },
        order: { updatedAt: 'DESC' },
      });
    } else if (type === 'active') {
      orders = await this.orderRepository.find({
        where: [
          { riderId, status: 'accepted' },
          { riderId, status: 'preparing' },
          { riderId, status: 'ready_for_pickup' },
          { riderId, status: 'picked_up' },
          { riderId, status: 'delivering' },
        ],
        relations: {
          vendor: true,
          items: true,
        },
        order: { updatedAt: 'DESC' },
      });
    }

    for (const order of orders) {
      await this.enrichOrderDetails(order);
    }

    return orders;
  }

  async acceptDelivery(orderId: string, riderId: string) {
    // Atomic claim: only succeeds if the booking hasn't been taken yet
    const result = await this.orderRepository.update(
      { id: orderId, status: 'accepted', riderId: IsNull() },
      { riderId },
    );

    if (result.affected === 0) {
      throw new BadRequestException(
        'This booking is no longer available or has already been claimed',
      );
    }

    const updatedOrder = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { vendor: true },
    });

    if (!updatedOrder) {
      throw new NotFoundException('Order not found');
    }

    await this.enrichOrderDetails(updatedOrder);
    await this.notifyDeliveryAccepted(updatedOrder);
    return updatedOrder;
  }

  async updateDeliveryStatus(
    orderId: string,
    riderId: string,
    updateStatusDto: UpdateDeliveryStatusDto,
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        vendor: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.riderId !== riderId) {
      throw new ForbiddenException('Delivery is assigned to another rider');
    }

    const transitions: Record<string, string[]> = {
      accepted: ['ready_for_pickup'],
      preparing: ['ready_for_pickup'],
      ready_for_pickup: ['picked_up'],
      picked_up: ['delivering'],
      delivering: ['delivered'],
    };

    const allowed = transitions[order.status] ?? [];
    if (!allowed.includes(updateStatusDto.status)) {
      throw new BadRequestException('Invalid status transition');
    }

    order.status = updateStatusDto.status;
    const updatedOrder = await this.orderRepository.save(order);
    await this.enrichOrderDetails(updatedOrder);
    await this.notifyDeliveryStatusUpdate(order, updateStatusDto.status);
    return updatedOrder;
  }

  private async notifyDeliveryAccepted(order: Order) {
    // Notify the customer
    await this.notificationsService.create({
      userId: order.customerId,
      title: 'Rider On The Way',
      message: 'A rider accepted your delivery and is heading to the shop',
      type: 'order_update',
      referenceId: order.id,
    });

    // Notify the seller so they know a rider is coming
    if (order.vendor?.userId) {
      await this.notificationsService.create({
        userId: order.vendor.userId,
        title: 'Rider Accepted',
        message: `A rider claimed the delivery for order #${order.id.slice(0, 8).toUpperCase()}`,
        type: 'delivery_request',
        referenceId: order.id,
      });
    }
  }

  private async notifyDeliveryStatusUpdate(
    order: Order,
    status: UpdateDeliveryStatusDto['status'],
  ) {
    if (status === 'ready_for_pickup') {
      await this.notificationsService.create({
        userId: order.customerId,
        title: 'Rider At The Shop',
        message: 'Your rider is at the shop waiting for your order',
        type: 'order_update',
        referenceId: order.id,
      });
      return;
    }

    if (status === 'picked_up') {
      await this.notificationsService.create({
        userId: order.customerId,
        title: 'Order Picked Up',
        message: 'Your order has been picked up and is moving to delivery',
        type: 'order_update',
        referenceId: order.id,
      });

      if (order.vendor?.userId) {
        await this.notificationsService.create({
          userId: order.vendor.userId,
          title: 'Order Picked Up',
          message: 'The rider has picked up the order from your shop',
          type: 'delivery_request',
          referenceId: order.id,
        });
      }
      return;
    }

    if (status === 'delivering') {
      await this.notificationsService.create({
        userId: order.customerId,
        title: 'Order On The Way',
        message: 'Your rider is on the way to your delivery pin',
        type: 'order_update',
        referenceId: order.id,
      });
      return;
    }

    // delivered
    await this.notificationsService.create({
      userId: order.customerId,
      title: 'Order Delivered',
      message: 'Your rider marked the order as delivered. Enjoy!',
      type: 'order_update',
      referenceId: order.id,
    });

    if (order.vendor?.userId) {
      await this.notificationsService.create({
        userId: order.vendor.userId,
        title: 'Order Delivered',
        message: 'The rider completed the delivery for this order',
        type: 'delivery_request',
        referenceId: order.id,
      });
    }
  }

  async enrichOrderDetails(order: Order): Promise<Order> {
    if (order.riderId) {
      const isSqlite =
        this.dataSource.options.type === 'better-sqlite3' ||
        this.dataSource.options.type === 'sqljs';
      const query = isSqlite
        ? 'SELECT name, phone FROM user WHERE id = ?'
        : 'SELECT name, phone FROM "user" WHERE id = $1';
      const riders = await this.dataSource.query(query, [order.riderId]);
      if (riders && riders[0]) {
        order.riderName = riders[0].name;
        order.riderPhone = riders[0].phone || 'N/A';
      }
    }
    if (order.customerId) {
      const isSqlite =
        this.dataSource.options.type === 'better-sqlite3' ||
        this.dataSource.options.type === 'sqljs';
      const query = isSqlite
        ? 'SELECT name, phone FROM user WHERE id = ?'
        : 'SELECT name, phone FROM "user" WHERE id = $1';
      const customers = await this.dataSource.query(query, [order.customerId]);
      if (customers && customers[0]) {
        order.customerName = customers[0].name;
        order.customerPhone = customers[0].phone || 'N/A';
      }
    }
    if (order.vendor && order.vendor.userId) {
      const isSqlite =
        this.dataSource.options.type === 'better-sqlite3' ||
        this.dataSource.options.type === 'sqljs';
      const query = isSqlite
        ? 'SELECT phone FROM user WHERE id = ?'
        : 'SELECT phone FROM "user" WHERE id = $1';
      const sellers = await this.dataSource.query(query, [order.vendor.userId]);
      if (sellers && sellers[0]) {
        order.vendorPhone = sellers[0].phone || 'N/A';
      }
    }
    return order;
  }
}
