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
import { Promotion } from './entities/promotion.entity';
import { Rating } from './entities/rating.entity';
import { Vendor } from './entities/vendor.entity';
import { RiderLocation } from './entities/rider-location.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { WithdrawalRequest } from './entities/withdrawal-request.entity';
import { Address } from './entities/address.entity';
import { Favorite } from './entities/favorite.entity';
import { RewardPoints } from './entities/reward-points.entity';
import { RewardTransaction } from './entities/reward-transaction.entity';
import { Referral } from './entities/referral.entity';
import { Voucher } from './entities/voucher.entity';
import { AddressesModule } from './addresses/addresses.module';
import { MenuModule } from './menu/menu.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PromotionsModule } from './promotions/promotions.module';
import { RatingsModule } from './ratings/ratings.module';
import { RidersModule } from './riders/riders.module';
import { VendorsModule } from './vendors/vendors.module';
import { FavoritesModule } from './favorites/favorites.module';
import { TrackingModule } from './tracking/tracking.module';
import { PaymentsModule } from './payments/payments.module';
import { WalletModule } from './wallet/wallet.module';
import { GeopayModule } from './geopay/geopay.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { EventsModule } from './events/events.module';

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
      Promotion,
      Rating,
      Notification,
      RiderLocation,
      Wallet,
      WalletTransaction,
      WithdrawalRequest,
      Address,
      Favorite,
      RewardPoints,
      RewardTransaction,
      Referral,
      Voucher,
    ]),
    VendorsModule,
    MenuModule,
    OrdersModule,
    PromotionsModule,
    RidersModule,
    RatingsModule,
    FavoritesModule,
    NotificationsModule,
    TrackingModule,
    PaymentsModule,
    WalletModule,
    GeopayModule,
    VouchersModule,
    AddressesModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
