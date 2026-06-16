import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from '../entities/menu-item.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { Rating } from '../entities/rating.entity';
import { Vendor } from '../entities/vendor.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';
import { GeopayModule } from '../geopay/geopay.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, MenuItem, Rating, Vendor]),
    NotificationsModule,
    WalletModule,
    GeopayModule,
    VouchersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
