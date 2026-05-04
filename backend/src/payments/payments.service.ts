import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async processPayment(orderId: string, customerId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== customerId) {
      throw new BadRequestException('Not authorized to pay for this order');
    }

    if (order.paymentStatus === 'paid') {
      throw new BadRequestException('Order is already paid');
    }

    if (order.paymentMethod === 'COD') {
      throw new BadRequestException('COD orders are paid upon delivery');
    }

    // Simulate API call to GCash/Maya/QRPh
    order.paymentStatus = 'paid';
    return this.orderRepository.save(order);
  }

  async markCodAsPaid(orderId: string, riderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.riderId !== riderId) {
      throw new BadRequestException(
        'Only the assigned rider can mark COD as paid',
      );
    }

    if (order.paymentMethod !== 'COD') {
      throw new BadRequestException('Order is not COD');
    }

    order.paymentStatus = 'paid';
    return this.orderRepository.save(order);
  }
}
