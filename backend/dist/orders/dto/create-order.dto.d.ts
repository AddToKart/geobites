export declare class CreateOrderItemDto {
    menuItemId: string;
    quantity: number;
}
export declare class CreateOrderDto {
    vendorId: string;
    deliveryAddress: string;
    deliveryLat?: number;
    deliveryLng?: number;
    notes?: string;
    items: CreateOrderItemDto[];
}
