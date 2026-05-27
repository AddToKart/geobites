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
const rating_entity_1 = require("./entities/rating.entity");
const vendor_entity_1 = require("./entities/vendor.entity");
const rider_location_entity_1 = require("./entities/rider-location.entity");
const menu_module_1 = require("./menu/menu.module");
const notifications_module_1 = require("./notifications/notifications.module");
const orders_module_1 = require("./orders/orders.module");
const ratings_module_1 = require("./ratings/ratings.module");
const riders_module_1 = require("./riders/riders.module");
const vendors_module_1 = require("./vendors/vendors.module");
const tracking_module_1 = require("./tracking/tracking.module");
const payments_module_1 = require("./payments/payments.module");
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
                rating_entity_1.Rating,
                notification_entity_1.Notification,
                rider_location_entity_1.RiderLocation,
            ]),
            vendors_module_1.VendorsModule,
            menu_module_1.MenuModule,
            orders_module_1.OrdersModule,
            riders_module_1.RidersModule,
            ratings_module_1.RatingsModule,
            notifications_module_1.NotificationsModule,
            tracking_module_1.TrackingModule,
            payments_module_1.PaymentsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map