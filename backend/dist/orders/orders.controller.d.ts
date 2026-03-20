import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(createOrderDto: CreateOrderDto, userId: string): Promise<import("../entities/order.entity").Order>;
    findAll(userId: string, role: string, query: QueryOrdersDto): Promise<{
        data: import("../entities/order.entity").Order[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string, userId: string, role: string): Promise<import("../entities/order.entity").Order>;
    updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, userId: string, role: string): Promise<import("../entities/order.entity").Order>;
}
