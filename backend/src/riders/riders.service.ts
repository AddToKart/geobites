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
import { UpdateRiderLocationDto } from './dto/update-rider-location.dto';
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

    if (type === 'active') {
      return this.orderRepository.find({
        where: [
          { riderId, status: 'ready_for_pickup' },
          { riderId, status: 'picked_up' },
          { riderId, status: 'delivering' },
        ],
        relations: {
          vendor: true,
        },
        order: { updatedAt: 'DESC' },
      });
    }

    return this.orderRepository.find({
      where: {
        status: 'ready_for_pickup',
        riderId: IsNull(),
      },
      relations: {
        vendor: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async acceptDelivery(orderId: string, riderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        vendor: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'ready_for_pickup') {
      throw new BadRequestException('Order is not ready for pickup');
    }

    if (order.riderId) {
      throw new BadRequestException(
        'Order has already been assigned to a rider',
      );
    }

    order.riderId = riderId;
    const updatedOrder = await this.orderRepository.save(order);
    await this.notifyDeliveryAccepted(order);
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

  async updateRiderLocation(
    orderId: string,
    riderId: string,
    updateLocationDto: UpdateRiderLocationDto,
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.riderId !== riderId) {
      throw new ForbiddenException('Delivery is assigned to another rider');
    }

    if (
      !['ready_for_pickup', 'picked_up', 'delivering'].includes(order.status)
    ) {
      throw new BadRequestException('Delivery location can no longer be updated');
    }

    order.riderLat = updateLocationDto.riderLat;
    order.riderLng = updateLocationDto.riderLng;

    return this.orderRepository.save(order);
  }

  private async notifyDeliveryAccepted(order: Order) {
    await this.notificationsService.create({
      userId: order.customerId,
      title: 'Rider Assigned',
      message: 'A rider has accepted your delivery request',
      type: 'order_update',
      referenceId: order.id,
    });

    if (order.vendor?.userId) {
      await this.notificationsService.create({
        userId: order.vendor.userId,
        title: 'Rider Assigned',
        message: 'A rider is heading to pick up this order',
        type: 'delivery_request',
        referenceId: order.id,
      });
    }
  }

  private async notifyDeliveryStatusUpdate(
    order: Order,
    status: UpdateDeliveryStatusDto['status'],
  ) {
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
        message: 'Your rider is on the way to the delivery pin',
        type: 'order_update',
        referenceId: order.id,
      });

      return;
    }

    await this.notificationsService.create({
      userId: order.customerId,
      title: 'Order Delivered',
      message: 'Your rider marked the order as delivered',
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
