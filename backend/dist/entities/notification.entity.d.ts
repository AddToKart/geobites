export declare class Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'order_update' | 'delivery_request' | 'rating' | 'system';
    referenceId?: string;
    isRead: boolean;
    createdAt: Date;
}
