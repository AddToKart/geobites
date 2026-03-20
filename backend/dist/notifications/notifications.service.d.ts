import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
export declare class NotificationsService {
    private readonly notificationRepository;
    constructor(notificationRepository: Repository<Notification>);
    findForUser(userId: string, query: QueryNotificationsDto): Promise<{
        data: Notification[];
        total: number;
        page: number;
        limit: number;
    }>;
    markAsRead(id: string, userId: string): Promise<Notification>;
    create(data: Partial<Notification>): Promise<Notification>;
}
