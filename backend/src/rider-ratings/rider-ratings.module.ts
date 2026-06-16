import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { RiderRating } from '../entities/rider-rating.entity';
import { Vendor } from '../entities/vendor.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RiderRatingsController } from './rider-ratings.controller';
import { RiderRatingsService } from './rider-ratings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RiderRating, Order, Vendor]),
    NotificationsModule,
  ],
  controllers: [RiderRatingsController],
  providers: [RiderRatingsService],
  exports: [RiderRatingsService],
})
export class RiderRatingsModule {}
