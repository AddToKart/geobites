import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getTypeOrmConfig } from './database/typeorm.config';
import { MenuItem } from './entities/menu-item.entity';
import { Notification } from './entities/notification.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { Rating } from './entities/rating.entity';
import { Vendor } from './entities/vendor.entity';
import { RiderLocation } from './entities/rider-location.entity';
import { MenuModule } from './menu/menu.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { RatingsModule } from './ratings/ratings.module';
import { RidersModule } from './riders/riders.module';
import { VendorsModule } from './vendors/vendors.module';
import { TrackingModule } from './tracking/tracking.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getTypeOrmConfig(configService),
    }),
    TypeOrmModule.forFeature([
      Vendor,
      MenuItem,
      Order,
      OrderItem,
      Rating,
      Notification,
      RiderLocation,
    ]),
    VendorsModule,
    MenuModule,
    OrdersModule,
    RidersModule,
    RatingsModule,
    NotificationsModule,
    TrackingModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
