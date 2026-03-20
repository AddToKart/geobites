import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(userId: string, query: QueryNotificationsDto): Promise<{
        data: import("../entities/notification.entity").Notification[];
        total: number;
        page: number;
        limit: number;
    }>;
    markAsRead(id: string, userId: string): Promise<import("../entities/notification.entity").Notification>;
}
