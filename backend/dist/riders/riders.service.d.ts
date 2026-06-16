import { DataSource, Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { QueryRiderDeliveriesDto } from './dto/query-rider-deliveries.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
export declare class RidersService {
    private readonly orderRepository;
    private readonly notificationsService;
    private readonly dataSource;
    constructor(orderRepository: Repository<Order>, notificationsService: NotificationsService, dataSource: DataSource);
    findDeliveries(riderId: string, query: QueryRiderDeliveriesDto): Promise<Order[]>;
    acceptDelivery(orderId: string, riderId: string): Promise<Order>;
    updateDeliveryStatus(orderId: string, riderId: string, updateStatusDto: UpdateDeliveryStatusDto): Promise<Order>;
    private notifyDeliveryAccepted;
    private notifyDeliveryStatusUpdate;
    enrichOrderDetails(order: Order): Promise<Order>;
}
