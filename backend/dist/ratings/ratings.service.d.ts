import { DataSource, Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { Rating } from '../entities/rating.entity';
import { Vendor } from '../entities/vendor.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRatingDto } from './dto/create-rating.dto';
export declare class RatingsService {
    private readonly ratingRepository;
    private readonly orderRepository;
    private readonly vendorRepository;
    private readonly notificationsService;
    private readonly dataSource;
    constructor(ratingRepository: Repository<Rating>, orderRepository: Repository<Order>, vendorRepository: Repository<Vendor>, notificationsService: NotificationsService, dataSource: DataSource);
    create(createRatingDto: CreateRatingDto, customerId: string): Promise<Rating>;
    findByVendor(vendorId: string): Promise<{
        averageScore: number;
        totalRatings: number;
        ratings: {
            id: string;
            score: number;
            feedback: string | undefined;
            customerName: string;
            createdAt: Date;
        }[];
    }>;
    private recomputeVendorRating;
}
