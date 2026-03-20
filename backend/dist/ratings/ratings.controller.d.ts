import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';
export declare class RatingsController {
    private readonly ratingsService;
    constructor(ratingsService: RatingsService);
    create(createRatingDto: CreateRatingDto, customerId: string): Promise<import("../entities/rating.entity").Rating>;
    findVendorRatings(vendorId: string): Promise<{
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
}
