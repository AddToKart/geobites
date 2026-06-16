import { DataSource, Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { RiderRating } from '../entities/rider-rating.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallet/wallet.service';
import { QueryRiderDeliveriesDto } from './dto/query-rider-deliveries.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
export declare class RidersService {
    private readonly orderRepository;
    private readonly riderRatingRepository;
    private readonly notificationsService;
    private readonly walletService;
    private readonly dataSource;
    constructor(orderRepository: Repository<Order>, riderRatingRepository: Repository<RiderRating>, notificationsService: NotificationsService, walletService: WalletService, dataSource: DataSource);
    getRiderStats(riderId: string): Promise<{
        totalDeliveries: number;
        completedDeliveries: number;
        totalEarnings: number;
        averageRating: number;
        totalRatings: number;
    }>;
    findDeliveries(riderId: string, query: QueryRiderDeliveriesDto): Promise<Order[]>;
    acceptDelivery(orderId: string, riderId: string): Promise<Order>;
    updateDeliveryStatus(orderId: string, riderId: string, updateStatusDto: UpdateDeliveryStatusDto): Promise<Order>;
    private notifyDeliveryAccepted;
    private notifyDeliveryStatusUpdate;
    enrichOrderDetails(order: Order): Promise<Order>;
}
