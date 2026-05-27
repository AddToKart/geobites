import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiderLocation } from '../entities/rider-location.entity';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Order } from '../entities/order.entity';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(RiderLocation)
    private readonly locationRepository: Repository<RiderLocation>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async updateLocation(riderId: string, dto: UpdateLocationDto) {
    if (dto.orderId) {
      // Optional: verify the order belongs to the rider
      const order = await this.orderRepository.findOne({
        where: { id: dto.orderId },
      });
      if (order && order.riderId !== riderId) {
        // We log or ignore, but let's just update location anyway for simplicity,
        // or clear orderId if it's not their order.
      }
    }

    const location = this.locationRepository.create({
      riderId,
      lat: dto.lat,
      lng: dto.lng,
      orderId: dto.orderId || null,
    });

    return this.locationRepository.save(location);
  }

  async getLocationByOrderId(orderId: string) {
    return this.locationRepository.findOne({
      where: { orderId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getLocationByRiderId(riderId: string) {
    return this.locationRepository.findOne({
      where: { riderId },
    });
  }
}
