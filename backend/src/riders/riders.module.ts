import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { RiderRating } from '../entities/rider-rating.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RidersController } from './riders.controller';
import { RidersService } from './riders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, RiderRating]),
    NotificationsModule,
  ],
  controllers: [RidersController],
  providers: [RidersService],
  exports: [RidersService],
})
export class RidersModule {}
