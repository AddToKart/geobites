"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const typeorm_config_1 = require("./database/typeorm.config");
const menu_item_entity_1 = require("./entities/menu-item.entity");
const notification_entity_1 = require("./entities/notification.entity");
const order_item_entity_1 = require("./entities/order-item.entity");
const order_entity_1 = require("./entities/order.entity");
const promotion_entity_1 = require("./entities/promotion.entity");
const rating_entity_1 = require("./entities/rating.entity");
const vendor_entity_1 = require("./entities/vendor.entity");
const rider_location_entity_1 = require("./entities/rider-location.entity");
const wallet_entity_1 = require("./entities/wallet.entity");
const wallet_transaction_entity_1 = require("./entities/wallet-transaction.entity");
const withdrawal_request_entity_1 = require("./entities/withdrawal-request.entity");
const address_entity_1 = require("./entities/address.entity");
const favorite_entity_1 = require("./entities/favorite.entity");
const reward_points_entity_1 = require("./entities/reward-points.entity");
const reward_transaction_entity_1 = require("./entities/reward-transaction.entity");
const referral_entity_1 = require("./entities/referral.entity");
const voucher_entity_1 = require("./entities/voucher.entity");
const addresses_module_1 = require("./addresses/addresses.module");
const menu_module_1 = require("./menu/menu.module");
const notifications_module_1 = require("./notifications/notifications.module");
const orders_module_1 = require("./orders/orders.module");
const promotions_module_1 = require("./promotions/promotions.module");
const ratings_module_1 = require("./ratings/ratings.module");
const riders_module_1 = require("./riders/riders.module");
const vendors_module_1 = require("./vendors/vendors.module");
const favorites_module_1 = require("./favorites/favorites.module");
const tracking_module_1 = require("./tracking/tracking.module");
const payments_module_1 = require("./payments/payments.module");
const wallet_module_1 = require("./wallet/wallet.module");
const geopay_module_1 = require("./geopay/geopay.module");
const vouchers_module_1 = require("./vouchers/vouchers.module");
const upload_module_1 = require("./upload/upload.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => (0, typeorm_config_1.getTypeOrmConfig)(configService),
            }),
            typeorm_1.TypeOrmModule.forFeature([
                vendor_entity_1.Vendor,
                menu_item_entity_1.MenuItem,
                order_entity_1.Order,
                order_item_entity_1.OrderItem,
                promotion_entity_1.Promotion,
                rating_entity_1.Rating,
                notification_entity_1.Notification,
                rider_location_entity_1.RiderLocation,
                wallet_entity_1.Wallet,
                wallet_transaction_entity_1.WalletTransaction,
                withdrawal_request_entity_1.WithdrawalRequest,
                address_entity_1.Address,
                favorite_entity_1.Favorite,
                reward_points_entity_1.RewardPoints,
                reward_transaction_entity_1.RewardTransaction,
                referral_entity_1.Referral,
                voucher_entity_1.Voucher,
            ]),
            vendors_module_1.VendorsModule,
            menu_module_1.MenuModule,
            orders_module_1.OrdersModule,
            promotions_module_1.PromotionsModule,
            riders_module_1.RidersModule,
            ratings_module_1.RatingsModule,
            favorites_module_1.FavoritesModule,
            notifications_module_1.NotificationsModule,
            tracking_module_1.TrackingModule,
            payments_module_1.PaymentsModule,
            wallet_module_1.WalletModule,
            geopay_module_1.GeopayModule,
            vouchers_module_1.VouchersModule,
            addresses_module_1.AddressesModule,
            upload_module_1.UploadModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map