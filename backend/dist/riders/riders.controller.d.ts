import { QueryRiderDeliveriesDto } from './dto/query-rider-deliveries.dto';
import { UpdateRiderLocationDto } from './dto/update-rider-location.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { RidersService } from './riders.service';
export declare class RidersController {
    private readonly ridersService;
    constructor(ridersService: RidersService);
    findDeliveries(riderId: string, query: QueryRiderDeliveriesDto): Promise<import("../entities/order.entity").Order[]>;
    acceptDelivery(orderId: string, riderId: string): Promise<import("../entities/order.entity").Order>;
    updateStatus(orderId: string, riderId: string, updateStatusDto: UpdateDeliveryStatusDto): Promise<import("../entities/order.entity").Order>;
    updateLocation(orderId: string, riderId: string, updateLocationDto: UpdateRiderLocationDto): Promise<import("../entities/order.entity").Order>;
}
