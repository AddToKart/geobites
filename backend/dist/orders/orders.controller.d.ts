import type { UserRole } from '../common/constants/roles';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(createOrderDto: CreateOrderDto, userId: string): Promise<import("../entities/order.entity").Order>;
    findAll(userId: string, role: UserRole, query: QueryOrdersDto): Promise<{
        data: import("../entities/order.entity").Order[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string, userId: string, role: UserRole): Promise<import("../entities/order.entity").Order>;
    updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, userId: string, role: UserRole): Promise<import("../entities/order.entity").Order>;
    getAvailableRiders(): Promise<any>;
    completeOrder(id: string, completeOrderDto: CompleteOrderDto, customerId: string): Promise<import("../entities/order.entity").Order>;
    assignRider(id: string, riderId: string, sellerId: string): Promise<import("../entities/order.entity").Order>;
}
