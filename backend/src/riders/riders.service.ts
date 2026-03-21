import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { QueryRiderDeliveriesDto } from './dto/query-rider-deliveries.dto';
import { UpdateRiderLocationDto } from './dto/update-rider-location.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

@Injectable()
export class RidersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
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
    return this.orderRepository.save(order);
  }

  async updateDeliveryStatus(
    orderId: string,
    riderId: string,
    updateStatusDto: UpdateDeliveryStatusDto,
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
    return this.orderRepository.save(order);
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
}
