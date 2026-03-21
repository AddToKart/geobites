import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { Rating } from '../entities/rating.entity';
import { Vendor } from '../entities/vendor.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating, Order, Vendor]),
    NotificationsModule,
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
