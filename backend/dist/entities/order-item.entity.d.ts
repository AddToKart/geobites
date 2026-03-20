import { MenuItem } from './menu-item.entity';
import { Order } from './order.entity';
export declare class OrderItem {
    id: string;
    orderId: string;
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    order: Order;
    menuItem: MenuItem;
}
