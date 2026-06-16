import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../common/constants/roles';
import { MenuItem } from '../entities/menu-item.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { Rating } from '../entities/rating.entity';
import { Vendor } from '../entities/vendor.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallet/wallet.service';
import { GeopayService } from '../geopay/geopay.service';
import { VouchersService } from '../vouchers/vouchers.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
export declare class OrdersService {
    private readonly orderRepository;
    private readonly orderItemRepository;
    private readonly menuItemRepository;
    private readonly ratingRepository;
    private readonly vendorRepository;
    private readonly notificationsService;
    private readonly walletService;
    private readonly geopayService;
    private readonly vouchersService;
    private readonly dataSource;
    private readonly logger;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, menuItemRepository: Repository<MenuItem>, ratingRepository: Repository<Rating>, vendorRepository: Repository<Vendor>, notificationsService: NotificationsService, walletService: WalletService, geopayService: GeopayService, vouchersService: VouchersService, dataSource: DataSource);
    create(createOrderDto: CreateOrderDto, customerId: string): Promise<Order>;
    findAllForUser(userId: string, role: UserRole, query: QueryOrdersDto): Promise<{
        data: Order[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOneForUser(id: string, userId: string, role: UserRole): Promise<Order>;
    updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, userId: string, role: UserRole): Promise<Order>;
    completeOrder(id: string, dto: {
        score: number;
        feedback?: string;
    }, customerId: string): Promise<Order>;
    getAvailableRiders(): Promise<any>;
    assignRider(id: string, riderId: string, sellerId: string): Promise<Order>;
    enrichOrderDetails(order: Order): Promise<Order>;
}
