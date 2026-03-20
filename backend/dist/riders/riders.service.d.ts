import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { QueryRiderDeliveriesDto } from './dto/query-rider-deliveries.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
export declare class RidersService {
    private readonly orderRepository;
    constructor(orderRepository: Repository<Order>);
    findDeliveries(riderId: string, query: QueryRiderDeliveriesDto): Promise<Order[]>;
    acceptDelivery(orderId: string, riderId: string): Promise<Order>;
    updateDeliveryStatus(orderId: string, riderId: string, updateStatusDto: UpdateDeliveryStatusDto): Promise<Order>;
}
