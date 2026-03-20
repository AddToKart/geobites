import { Repository } from 'typeorm';
import { UserRole } from '../common/constants/roles';
import { MenuItem } from '../entities/menu-item.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { Vendor } from '../entities/vendor.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
export declare class OrdersService {
    private readonly orderRepository;
    private readonly orderItemRepository;
    private readonly menuItemRepository;
    private readonly vendorRepository;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, menuItemRepository: Repository<MenuItem>, vendorRepository: Repository<Vendor>);
    create(createOrderDto: CreateOrderDto, customerId: string): Promise<Order>;
    findAllForUser(userId: string, role: UserRole, query: QueryOrdersDto): Promise<{
        data: Order[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOneForUser(id: string, userId: string, role: UserRole): Promise<Order>;
    updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, userId: string, role: UserRole): Promise<Order>;
}
