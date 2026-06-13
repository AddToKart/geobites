import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { QueryRiderDeliveriesDto } from './dto/query-rider-deliveries.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

@Injectable()
export class RidersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findDeliveries(riderId: string, query: QueryRiderDeliveriesDto) {
    const type = query.type ?? 'available';

    if (type === 'available') {
      // Global booking pool: orders accepted by seller, not yet claimed by a rider
      return this.orderRepository.find({
        where: {
          status: 'accepted',
          riderId: IsNull(),
        },
        relations: {
          vendor: true,
          items: true,
        },
        order: { updatedAt: 'DESC' },
      });
    }

    if (type === 'active') {
      return this.orderRepository.find({
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

    return [];
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
}
